"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { checkAchievements } from "./achievements";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const SessionSchema = z.object({
  taskId: z.string().optional(),
  minutes: z.number().int().min(0).max(480),
  completion: z.number().int().min(0).max(100),
  goldEarned: z.number().int().min(0),
  xpEarned: z.number().int().min(0),
});

export async function saveFocusSession(input: {
  taskId?: string;
  minutes: number;
  completion: number;
  goldEarned: number;
  xpEarned: number;
}) {
  const userId = await requireAuth();
  const parsed = SessionSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { taskId, minutes, completion, goldEarned, xpEarned } = parsed.data;

  // Verify task belongs to user and is not already completed
  if (taskId) {
    const task = await db.task.findFirst({ where: { id: taskId, userId } });
    if (!task) return { error: "Task not found" };
    if (task.status === "completed") {
      // Session save still works, but no rewards
      await db.focusSession.create({
        data: { userId, taskId, minutes, completion, goldEarned: 0, xpEarned: 0 },
      });
      return { gold: 0, xp: 0 };
    }

    // Mark task completed/partial
    const newStatus = completion >= 100 ? "completed" : "partial";
    await db.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completion,
        focusMinutes: { increment: minutes },
      },
    });
  }

  // Validate reward amounts server-side (cap at reasonable max)
  const safeGold = Math.min(goldEarned, 500);
  const safeXp = Math.min(xpEarned, 1000);

  const today = new Date().toISOString().slice(0, 10);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const newStreak =
    user.lastActiveDate === today
      ? user.streak
      : user.lastActiveDate === yesterday.toISOString().slice(0, 10)
      ? user.streak + 1
      : 1;

  await db.focusSession.create({
    data: { userId, taskId, minutes, completion, goldEarned: safeGold, xpEarned: safeXp },
  });

  await db.user.update({
    where: { id: userId },
    data: {
      gold: { increment: safeGold },
      xp: { increment: safeXp },
      focusMinutes: { increment: minutes },
      streak: newStreak,
      lastActiveDate: today,
    },
  });

  await checkAchievements(userId);
  revalidatePath("/focus");
  revalidatePath("/progress");

  return { gold: safeGold, xp: safeXp, streak: newStreak };
}

export async function getFocusHistory() {
  const userId = await requireAuth();
  const sessions = await db.focusSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 50,
    include: { task: { select: { title: true, category: true } } },
  });
  return sessions;
}
