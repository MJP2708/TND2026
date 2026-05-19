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

// Item sell value = 50% of original cost
const SELL_REFUND_RATE = 0.5;
const ITEM_COSTS: Record<string, number> = {
  desk: 450, shelf: 350, plant: 200, lamp: 150, sofa: 600, board: 300,
  trophy: 800, flag: 250, stars: 400, fountain: 1200, garden: 550, art: 700,
};

export async function getCity() {
  const userId = await requireAuth();
  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: { orderBy: { placedAt: "asc" } } },
  });
  if (!city) {
    // Auto-create city on first access
    return db.city.create({
      data: { userId },
      include: { buildings: true },
    });
  }
  return city;
}

const PlaceSchema = z.object({
  buildingId: z.string(),
  x: z.number().int().min(0).max(9),
  y: z.number().int().min(0).max(7),
});

export async function placeBuilding(input: { buildingId: string; x: number; y: number }) {
  const userId = await requireAuth();
  const parsed = PlaceSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid coordinates" };

  const { buildingId, x, y } = parsed.data;

  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: true },
  });
  if (!city) return { error: "City not found" };

  const building = city.buildings.find((b) => b.id === buildingId);
  if (!building) return { error: "Building not found" };

  // Check for overlap
  const occupied = city.buildings.some(
    (b) => b.id !== buildingId && b.x === x && b.y === y
  );
  if (occupied) return { error: "Tile is already occupied" };

  await db.placedBuilding.update({
    where: { id: buildingId },
    data: { x, y },
  });

  await checkAchievements(userId);
  revalidatePath("/community");
  return { success: true };
}

export async function moveBuilding(input: { buildingId: string; x: number; y: number }) {
  const userId = await requireAuth();
  const parsed = PlaceSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid coordinates" };

  const { buildingId, x, y } = parsed.data;

  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: true },
  });
  if (!city) return { error: "City not found" };

  const building = city.buildings.find((b) => b.id === buildingId);
  if (!building || building.x < 0) return { error: "Building not on grid" };

  const occupied = city.buildings.some(
    (b) => b.id !== buildingId && b.x === x && b.y === y
  );
  if (occupied) return { error: "Tile is already occupied" };

  await db.placedBuilding.update({
    where: { id: buildingId },
    data: { x, y },
  });

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
  const originalCost = ITEM_COSTS[building.itemId] ?? 200;
  const refund = Math.round(originalCost * SELL_REFUND_RATE);

  await db.placedBuilding.delete({ where: { id: buildingId } });

  await db.user.update({
    where: { id: userId },
    data: { gold: { increment: refund } },
  });

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
  const baseCost = ITEM_COSTS[building.itemId] ?? 200;
  const upgradeCost = Math.round(baseCost * 0.5 * building.level);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };
  if (user.gold < upgradeCost) return { error: "Not enough gold", needed: upgradeCost };

  await db.placedBuilding.update({
    where: { id: buildingId },
    data: { level: { increment: 1 } },
  });

  await db.user.update({
    where: { id: userId },
    data: { gold: { decrement: upgradeCost } },
  });

  revalidatePath("/community");
  return { success: true, upgradeCost };
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

  await db.placedBuilding.update({
    where: { id: buildingId },
    data: { rotation: newRotation },
  });

  revalidatePath("/community");
  return { success: true, rotation: newRotation };
}
