"use server";

import { requireAuth } from "./require-auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkAchievements } from "./achievements";
import { checkEraProgression, applyHappinessDelta } from "./game-state";
import { rateLimit } from "@/lib/rate-limit";
import { ITEM_CATALOG } from "@/lib/item-catalog";
import type { EraType } from "@/lib/types";

export async function buyItem(itemId: string) {
  const userId = await requireAuth();

  if (!rateLimit.purchase(userId)) return { error: "Too many purchases — slow down" };

  const item = ITEM_CATALOG[itemId];
  if (!item) return { error: "Item not found" };

  // Pre-flight checks (outside transaction for speed)
  const [user, gs] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.gameState.findUnique({ where: { userId } }),
  ]);
  if (!user) return { error: "User not found" };

  const ERA_ORDER: EraType[] = ["pioneer", "modern", "metropolis"];
  const currentEra = (gs?.currentEra ?? "pioneer") as EraType;
  if (ERA_ORDER.indexOf(item.era) > ERA_ORDER.indexOf(currentEra)) {
    return { error: `Unlocks in ${item.era === "modern" ? "Modern City" : "Metropolis"} era` };
  }

  const hasDiscount = gs?.constructionDiscount ?? false;
  const discountFactor = hasDiscount ? 0.5 : 1.0;
  const requiredEnergy = Math.ceil(item.energyCost * discountFactor);
  const requiredGold = Math.ceil(item.goldCost * discountFactor);

  if (user.energy < requiredEnergy) {
    return { error: "Not enough Energy ⚡", needed: requiredEnergy, have: user.energy };
  }
  if (user.gold < requiredGold) {
    return { error: "Not enough Gold 🪙", needed: requiredGold, have: user.gold };
  }

  let purchaseId = "";
  try {
    const result = await db.$transaction(async (tx) => {
      const freshUser = await tx.user.findUnique({ where: { id: userId }, select: { gold: true, energy: true } });
      if (!freshUser || freshUser.gold < requiredGold || freshUser.energy < requiredEnergy) {
        throw new Error("Insufficient funds");
      }

      await tx.user.update({
        where: { id: userId },
        data: { energy: { decrement: requiredEnergy }, gold: { decrement: requiredGold } },
      });

      const purchase = await tx.purchase.create({
        data: { userId, itemId, itemName: item.name, category: item.category, cost: requiredGold },
      });

      if (item.isBuilding) {
        const city = await tx.city.upsert({ where: { userId }, create: { userId }, update: {} });
        const nextMaintenance = new Date();
        nextMaintenance.setDate(nextMaintenance.getDate() + 7);
        await tx.placedBuilding.create({
          data: {
            cityId: city.id,
            itemId,
            name: item.name,
            icon: item.icon,
            category: item.category,
            district: item.district,
            tier: item.tier,
            health: "healthy",
            maintenanceDue: nextMaintenance,
            citizens: item.district === "residential" ? 5 : 0,
            x: -1,
            y: -1,
          },
        });

        const totalBuilt = (gs?.totalBuilt ?? 0) + 1;
        await tx.gameState.upsert({
          where: { userId },
          create: { userId, totalBuilt, constructionDiscount: false },
          update: { totalBuilt, constructionDiscount: false },
        });
      } else if (hasDiscount) {
        await tx.gameState.upsert({
          where: { userId },
          create: { userId, constructionDiscount: false },
          update: { constructionDiscount: false },
        });
      }

      return purchase;
    });
    purchaseId = result.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Purchase failed";
    return { error: msg };
  }

  if (item.isBuilding) {
    if (item.category === "Decor" || item.district === "green") {
      await applyHappinessDelta(userId, 3).catch(() => {});
    }
    await checkEraProgression(userId).catch(() => {});
  }
  await checkAchievements(userId).catch(() => {});

  revalidatePath("/rewards");
  revalidatePath("/community");

  return {
    success: true,
    purchaseId,
    newGold: user.gold - requiredGold,
    newEnergy: user.energy - requiredEnergy,
  };
}

export async function getPurchases() {
  const userId = await requireAuth();
  return db.purchase.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function getInventory() {
  const userId = await requireAuth();
  const city = await db.city.findUnique({ where: { userId } });
  if (!city) return [];
  return db.placedBuilding.findMany({
    where: { cityId: city.id, x: -1 },
    orderBy: { placedAt: "desc" },
  });
}
