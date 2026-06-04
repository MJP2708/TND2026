"use server";

import { requireAuth } from "./require-auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function ownGoal(goalId: string, userId: string) {
  const goal = await db.goal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new Error("Goal not found");
  return goal;
}

export async function archiveGoal(goalId: string) {
  const userId = await requireAuth();
  await ownGoal(goalId, userId);
  await db.goal.update({ where: { id: goalId }, data: { status: "archived", isActive: false } });
  revalidatePath("/plan");
  return { success: true };
}

export async function deleteGoal(goalId: string) {
  const userId = await requireAuth();
  await ownGoal(goalId, userId);
  await db.goal.delete({ where: { id: goalId } });
  revalidatePath("/plan");
  return { success: true };
}

export async function pauseGoal(goalId: string) {
  const userId = await requireAuth();
  await ownGoal(goalId, userId);
  await db.goal.update({ where: { id: goalId }, data: { status: "paused", isActive: false } });
  revalidatePath("/plan");
  return { success: true };
}

export async function resumeGoal(goalId: string) {
  const userId = await requireAuth();
  await ownGoal(goalId, userId);
  await db.goal.update({ where: { id: goalId }, data: { status: "active", isActive: true } });
  revalidatePath("/plan");
  return { success: true };
}

export async function completeGoal(goalId: string) {
  const userId = await requireAuth();
  await ownGoal(goalId, userId);
  await db.goal.update({ where: { id: goalId }, data: { status: "completed", isActive: false } });
  revalidatePath("/plan");
  return { success: true };
}
