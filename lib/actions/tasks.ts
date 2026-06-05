"use server";

import { requireAuth } from "./require-auth";
import { db } from "@/lib/db";
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

// Gold awarded by task difficulty (priority proxy)
// low (1-2) = 10, medium (3) = 20, high (4-5) = 35
function goldByPriority(difficulty: number): number {
  if (difficulty <= 2) return 10;
  if (difficulty === 3) return 20;
  return 35;
}

export async function savePlan(tasks: {
  id: string;
  day: string;
  title: string;
  category: string;
  minutes: number;
  difficulty: number;
  gold: number;
  xp: number;
  isRecovery?: boolean;
}[], goal: {
  title: string;
  deadline: string;
  dailyHours: number;
  energy: string;
  difficulty: number;
  category: string;
}) {
  const userId = await requireAuth();

  await db.goal.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  const newGoal = await db.goal.create({
    data: {
      userId,
      title: goal.title,
      deadline: goal.deadline,
      dailyHours: goal.dailyHours,
      energy: goal.energy,
      difficulty: goal.difficulty,
      category: goal.category,
    },
  });

  await db.task.createMany({
    data: tasks.map((t) => ({
      id: t.id,
      userId,
      goalId: newGoal.id,
      day: t.day,
      title: t.title,
      category: t.category,
      minutes: t.minutes,
      difficulty: t.difficulty,
      gold: t.gold,
      xp: t.xp,
      isRecovery: t.isRecovery ?? false,
    })),
  });

  revalidatePath("/plan");
  return { goalId: newGoal.id };
}

export async function completeTask(taskId: string, completionPct = 100) {
  const userId = await requireAuth();

  if (!rateLimit.generic(userId)) return { error: "Too many requests — slow down" };

  const today = new Date().toISOString().slice(0, 10);
  const pct = Math.min(Math.max(Math.round(completionPct / 10) * 10, 10), 100);
  const isFullyDone = pct === 100;

  let finalGold = 0;
  let taskXp = 0;
  let newStreak = 0;
  let oldStreak = 0;

  try {
    const result = await db.$transaction(async (tx) => {
      const task = await tx.task.findFirst({ where: { id: taskId, userId } });
      if (!task) throw new Error("Task not found");
      if (task.status === "completed") throw new Error("Already completed");

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");

      const streak = isFullyDone ? calcNewStreak(user.lastActiveDate, user.streak) : user.streak;
      const happinessMultiplier = getHappinessMultiplier(user.happiness ?? 50);
      const baseGold = goldByPriority(task.difficulty);
      const fullGold = Math.floor((task.gold + baseGold) * happinessMultiplier);
      const gold = Math.floor(fullGold * (pct / 100));
      const xp   = Math.floor(task.xp * (pct / 100));

      await tx.task.update({
        where: { id: taskId },
        data: {
          status: isFullyDone ? "completed" : "pending",
          completion: pct,
          focusMinutes: isFullyDone ? task.minutes : task.focusMinutes,
          updatedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          gold: { increment: gold },
          xp: { increment: xp },
          focusMinutes: isFullyDone ? { increment: task.minutes } : undefined,
          streak: isFullyDone ? streak : undefined,
          lastActiveDate: isFullyDone ? today : undefined,
        },
      });

      return { gold, xp, streak, oldStreak: user.streak };
    });

    finalGold = result.gold;
    taskXp = result.xp;
    newStreak = result.streak;
    oldStreak = result.oldStreak;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed" };
  }

  // Non-critical side effects after successful transaction
  const todayDone = await db.task.count({ where: { userId, day: today, status: "completed" } });
  if (todayDone >= 3) await applyHappinessDelta(userId, 5).catch(() => {});
  if (newStreak !== oldStreak) await applyStreakMilestoneReward(userId, newStreak).catch(() => {});

  await checkAchievements(userId).catch(() => {});
  await checkEraProgression(userId).catch(() => {});

  try {
    await updateQuestProgress("complete_1_task", 1, userId);
    await updateQuestProgress("complete_3_tasks", 1, userId);
    await boostCompanionFromActivity(userId, "task");
  } catch { /* non-critical */ }

  revalidatePath("/plan");
  revalidatePath("/dashboard");

  return { gold: finalGold, xp: taskXp, streak: newStreak, completionPct: pct };
}

export async function loadUserPlan() {
  const userId = await requireAuth();
  const goal = await db.goal.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
    include: { tasks: { orderBy: { day: "asc" } } },
  });
  return goal;
}

export async function clearPlan() {
  const userId = await requireAuth();
  await db.goal.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
  revalidatePath("/plan");
}
