"use server";

import { auth } from "@/auth";
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

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

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

export async function completeTask(taskId: string) {
  const userId = await requireAuth();

  const task = await db.task.findFirst({ where: { id: taskId, userId } });
  if (!task) return { error: "Task not found" };
  if (task.status === "completed") return { error: "Already completed" };

  const today = new Date().toISOString().slice(0, 10);

  await db.task.update({
    where: { id: taskId },
    data: {
      status: "completed",
      completion: 100,
      focusMinutes: task.minutes,
      updatedAt: new Date(),
    },
  });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);
  const newStreak =
    user.lastActiveDate === today
      ? user.streak
      : user.lastActiveDate === yStr
      ? user.streak + 1
      : 1;

  // Apply happiness multiplier to gold reward
  const happinessMultiplier = getHappinessMultiplier(user.happiness ?? 50);
  const baseGold = goldByPriority(task.difficulty);
  const finalGold = Math.floor((task.gold + baseGold) * happinessMultiplier);

  await db.user.update({
    where: { id: userId },
    data: {
      gold: { increment: finalGold },
      xp: { increment: task.xp },
      focusMinutes: { increment: task.minutes },
      streak: newStreak,
      lastActiveDate: today,
    },
  });

  // Check if 3+ tasks completed today → +5 happiness
  const todayDone = await db.task.count({
    where: { userId, day: today, status: "completed" },
  });
  if (todayDone >= 3) {
    await applyHappinessDelta(userId, 5);
  }

  // Streak milestone rewards
  if (newStreak !== user.streak) {
    await applyStreakMilestoneReward(userId, newStreak);
  }

  await checkAchievements(userId);
  await checkEraProgression(userId);

  try {
    await updateQuestProgress("complete_1_task", 1, userId);
    await updateQuestProgress("complete_3_tasks", 1, userId);
    await boostCompanionFromActivity(userId, "task");
  } catch { /* non-critical */ }

  revalidatePath("/plan");
  revalidatePath("/dashboard");

  return { gold: finalGold, xp: task.xp, streak: newStreak };
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
