"use server";

import { requireAuth } from "./require-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { checkAchievements } from "./achievements";
import { updateQuestProgress } from "./quests";
import { boostCompanionFromActivity } from "./companion";
import {
  applyHappinessDelta,
  applyStreakMilestoneReward,
  checkEraProgression,
} from "./game-state";
import { getHappinessMultiplier } from "@/lib/game-utils";
import { calcNewStreak } from "@/lib/streak-utils";
import { rateLimit } from "@/lib/rate-limit";

const SessionSchema = z.object({
  taskId: z.string().optional(),
  minutes: z.number().int().min(0).max(480),
  completion: z.number().int().min(0).max(100),
  goldEarned: z.number().int().min(0),
  xpEarned: z.number().int().min(0),
});

// Energy awarded per session length:
// 25 min = 50 Energy, 50 min = 110 Energy, proportional otherwise
function calcEnergy(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes <= 25) return Math.round((minutes / 25) * 50);
  return Math.round(50 + ((minutes - 25) / 25) * 60);
}

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
  if (!rateLimit.focusSave(userId)) return { error: "Too many requests — slow down" };

  const { taskId, minutes, completion, goldEarned, xpEarned } = parsed.data;

  if (taskId) {
    const task = await db.task.findFirst({ where: { id: taskId, userId } });
    if (!task) return { error: "Task not found" };
    if (task.status === "completed") {
      await db.focusSession.create({
        data: { userId, taskId, minutes, completion, goldEarned: 0, xpEarned: 0 },
      });
      return { gold: 0, xp: 0, energy: 0 };
    }

    const newStatus = completion >= 100 ? "completed" : "partial";
    await db.task.update({
      where: { id: taskId },
      data: { status: newStatus, completion, focusMinutes: { increment: minutes } },
    });
  }

  const safeGold = Math.min(goldEarned, 500);
  const safeXp = Math.min(xpEarned, 1000);
  const energyEarned = calcEnergy(minutes);

  const today = new Date().toISOString().slice(0, 10);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  const newStreak = calcNewStreak(user.lastActiveDate, user.streak);

  // Apply happiness multiplier to gold/energy rewards
  const happinessMultiplier = getHappinessMultiplier(user.happiness ?? 50);
  const finalGold = Math.floor(safeGold * happinessMultiplier);
  const finalEnergy = Math.floor(energyEarned * happinessMultiplier);

  await db.focusSession.create({
    data: { userId, taskId, minutes, completion, goldEarned: finalGold, xpEarned: safeXp },
  });

  await db.user.update({
    where: { id: userId },
    data: {
      gold: { increment: finalGold },
      energy: { increment: finalEnergy },
      xp: { increment: safeXp },
      focusMinutes: { increment: minutes },
      streak: newStreak,
      lastActiveDate: today,
    },
  });

  // Happiness: focus ≥ 25 min → +10
  if (minutes >= 25) {
    await applyHappinessDelta(userId, 10);
  }

  // Streak milestone rewards
  if (newStreak !== user.streak) {
    await applyStreakMilestoneReward(userId, newStreak);
  }

  await checkAchievements(userId);
  await checkEraProgression(userId);

  try {
    await updateQuestProgress("focus_25min", minutes, userId);
    await updateQuestProgress("focus_60min", minutes, userId);
    await boostCompanionFromActivity(userId, "focus");
  } catch { /* non-critical */ }

  revalidatePath("/focus");
  revalidatePath("/progress");

  return { gold: finalGold, xp: safeXp, energy: finalEnergy, streak: newStreak };
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
