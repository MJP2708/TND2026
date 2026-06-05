"use server";

import { requireAuth } from "./require-auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const RewardSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  description: z.string().max(300).optional(),
  coinsRequired: z.number().int().min(10).max(10000),
  icon: z.string().max(10).default("🎁"),
});

export async function createCustomReward(input: z.infer<typeof RewardSchema>) {
  const userId = await requireAuth();
  const parsed = RewardSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };

  await db.customReward.create({
    data: { userId, ...parsed.data },
  });

  revalidatePath("/rewards");
  return { success: true };
}

export async function claimCustomReward(rewardId: string) {
  const userId = await requireAuth();

  try {
    await db.$transaction(async (tx) => {
      const reward = await tx.customReward.findUnique({
        where: { id: rewardId, userId },
      });
      if (!reward) throw new Error("not_found");
      if (reward.claimedAt) throw new Error("already_claimed");

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { gold: true },
      });
      if (!user || user.gold < reward.coinsRequired) throw new Error("insufficient_coins");

      await tx.user.update({
        where: { id: userId },
        data: { gold: { decrement: reward.coinsRequired } },
      });

      await tx.customReward.update({
        where: { id: rewardId },
        data: { claimedAt: new Date(), unlockedAt: new Date() },
      });
    });

    revalidatePath("/rewards");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "failed" };
  }
}

export async function deleteCustomReward(rewardId: string) {
  const userId = await requireAuth();
  await db.customReward.deleteMany({ where: { id: rewardId, userId } });
  revalidatePath("/rewards");
  return { success: true };
}

export async function getUserRewards() {
  const userId = await requireAuth();
  const [rewards, user] = await Promise.all([
    db.customReward.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    db.user.findUnique({ where: { id: userId }, select: { gold: true } }),
  ]);
  return { rewards, gold: user?.gold ?? 0 };
}
