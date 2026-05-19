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

// Save a full AI-generated plan to the database
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

  // Deactivate old goals
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

// Complete a task — server-side validation of rewards
export async function completeTask(taskId: string) {
  const userId = await requireAuth();

  const task = await db.task.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) return { error: "Task not found" };
  if (task.status === "completed") return { error: "Already completed" };

  const today = new Date().toISOString().slice(0, 10);

  // Update task
  await db.task.update({
    where: { id: taskId },
    data: {
      status: "completed",
      completion: 100,
      focusMinutes: task.minutes,
      updatedAt: new Date(),
    },
  });

  // Award gold + XP to user
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

  await db.user.update({
    where: { id: userId },
    data: {
      gold: { increment: task.gold },
      xp: { increment: task.xp },
      focusMinutes: { increment: task.minutes },
      streak: newStreak,
      lastActiveDate: today,
    },
  });

  await checkAchievements(userId);
  revalidatePath("/plan");
  revalidatePath("/dashboard");

  return {
    gold: task.gold,
    xp: task.xp,
    streak: newStreak,
  };
}

// Load user's active goal + tasks
export async function loadUserPlan() {
  const userId = await requireAuth();

  const goal = await db.goal.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
    include: { tasks: { orderBy: { day: "asc" } } },
  });

  return goal;
}

// Delete current plan (for regeneration)
export async function clearPlan() {
  const userId = await requireAuth();
  await db.goal.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
  revalidatePath("/plan");
}
