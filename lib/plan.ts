"use server";

import { db } from "@/lib/db";

export async function getUserPlan(userId: string): Promise<"free" | "pro"> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiry: true },
  });
  if (!user) return "free";
  if (user.plan === "pro") {
    if (!user.planExpiry || user.planExpiry > new Date()) return "pro";
    await db.user.update({ where: { id: userId }, data: { plan: "free" } });
  }
  return "free";
}

export async function requirePro(userId: string): Promise<boolean> {
  return (await getUserPlan(userId)) === "pro";
}

export async function grantPro(userId: string, months = 1): Promise<void> {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);
  await db.user.update({
    where: { id: userId },
    data: { plan: "pro", planExpiry: expiry },
  });
}
