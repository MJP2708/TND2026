"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { checkAchievements } from "./achievements";
import { ITEM_CATALOG } from "./shop";
import type { DistrictType } from "@/lib/types";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const SELL_REFUND_RATE = 0.5;

// District-slot coordinate system:
// Each district has a 3×2 grid (6 slots).
// x = 0-2 (column within district), y = 0-1 (row within district)
// district stored separately.
const PlaceSchema = z.object({
  buildingId: z.string(),
  x: z.number().int().min(0).max(2),
  y: z.number().int().min(0).max(1),
  district: z.enum(["residential", "industrial", "green", "knowledge"]),
});

export async function getCity() {
  const userId = await requireAuth();
  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: { orderBy: { constructedAt: "asc" } } },
  });
  if (!city) {
    return db.city.create({ data: { userId }, include: { buildings: true } });
  }
  return city;
}

export async function placeBuilding(input: { buildingId: string; x: number; y: number; district: DistrictType }) {
  const userId = await requireAuth();
  const parsed = PlaceSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid placement" };

  const { buildingId, x, y, district } = parsed.data;

  const city = await db.city.findUnique({ where: { userId }, include: { buildings: true } });
  if (!city) return { error: "City not found" };

  const building = city.buildings.find((b) => b.id === buildingId);
  if (!building) return { error: "Building not found" };

  // Check for overlap within the same district
  const occupied = city.buildings.some(
    (b) => b.id !== buildingId && b.x === x && b.y === y && b.district === district
  );
  if (occupied) return { error: "Slot already occupied" };

  await db.placedBuilding.update({
    where: { id: buildingId },
    data: { x, y, district },
  });

  await checkAchievements(userId);
  revalidatePath("/community");
  return { success: true };
}

export async function moveBuilding(input: { buildingId: string; x: number; y: number; district: DistrictType }) {
  const userId = await requireAuth();
  const parsed = PlaceSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid placement" };

  const { buildingId, x, y, district } = parsed.data;

  const city = await db.city.findUnique({ where: { userId }, include: { buildings: true } });
  if (!city) return { error: "City not found" };

  const building = city.buildings.find((b) => b.id === buildingId);
  if (!building || building.x < 0) return { error: "Building not on grid" };

  const occupied = city.buildings.some(
    (b) => b.id !== buildingId && b.x === x && b.y === y && b.district === district
  );
  if (occupied) return { error: "Slot already occupied" };

  await db.placedBuilding.update({ where: { id: buildingId }, data: { x, y, district } });

  revalidatePath("/community");
  return { success: true };
}

export async function sellBuilding(buildingId: string) {
  const userId = await requireAuth();

  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: { where: { id: buildingId } } },
  });
  if (!city || city.buildings.length === 0) return { error: "Building not found" };

  const building = city.buildings[0];
  const catalogItem = ITEM_CATALOG[building.itemId];
  const originalCost = catalogItem ? catalogItem.goldCost : 200;
  const refund = Math.round(originalCost * SELL_REFUND_RATE);

  await db.placedBuilding.delete({ where: { id: buildingId } });
  await db.user.update({ where: { id: userId }, data: { gold: { increment: refund } } });

  revalidatePath("/community");
  return { success: true, refund };
}

export async function upgradeBuilding(buildingId: string) {
  const userId = await requireAuth();

  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: { where: { id: buildingId } } },
  });
  if (!city || city.buildings.length === 0) return { error: "Building not found" };

  const building = city.buildings[0];
  const catalogItem = ITEM_CATALOG[building.itemId];
  const baseGoldCost = catalogItem ? catalogItem.goldCost : 200;
  const baseEnergyCost = catalogItem ? catalogItem.energyCost : 50;

  const goldUpgradeCost = Math.round(baseGoldCost * 0.5 * building.level);
  const energyUpgradeCost = Math.round(baseEnergyCost * 0.3 * building.level);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };
  if (user.gold < goldUpgradeCost) return { error: "Not enough gold", needed: goldUpgradeCost };
  if (user.energy < energyUpgradeCost) return { error: "Not enough energy", needed: energyUpgradeCost };

  await db.placedBuilding.update({
    where: { id: buildingId },
    data: { level: { increment: 1 }, tier: Math.min(5, building.tier + 1) },
  });

  await db.user.update({
    where: { id: userId },
    data: { gold: { decrement: goldUpgradeCost }, energy: { decrement: energyUpgradeCost } },
  });

  revalidatePath("/community");
  return { success: true, goldUpgradeCost, energyUpgradeCost };
}

export async function rotatBuilding(buildingId: string) {
  const userId = await requireAuth();

  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: { where: { id: buildingId } } },
  });
  if (!city || city.buildings.length === 0) return { error: "Building not found" };

  const building = city.buildings[0];
  const newRotation = (building.rotation + 90) % 360;

  await db.placedBuilding.update({ where: { id: buildingId }, data: { rotation: newRotation } });

  revalidatePath("/community");
  return { success: true, rotation: newRotation };
}

// Check district mastery: 4+ correct-type buildings in a district
export async function checkDistrictMastery(): Promise<Record<string, boolean>> {
  const userId = await requireAuth();
  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: { where: { x: { gte: 0 }, health: { not: "collapsed" } } } },
  });
  if (!city) return {};

  const districtCorrect: Record<DistrictType, string[]> = {
    residential: ["cottage", "cafe", "apartment", "sofa"],
    industrial:  ["farm", "office", "skyscraper", "desk"],
    green:       ["park", "garden", "campfire", "fountain", "gym", "skygarden", "plant", "lamp"],
    knowledge:   ["market", "library", "techlab", "aicenter", "shelf", "board"],
  };

  const result: Record<string, boolean> = {};
  const districts: DistrictType[] = ["residential", "industrial", "green", "knowledge"];

  for (const d of districts) {
    const inDistrict = city.buildings.filter((b) => b.district === d);
    const correctType = inDistrict.filter((b) => districtCorrect[d].includes(b.itemId));
    result[d] = correctType.length >= 4;
  }

  return result;
}
