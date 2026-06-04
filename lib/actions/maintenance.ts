"use server";

import { requireAuth } from "./require-auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { applyHappinessDelta } from "./game-state";

// Gold maintenance cost per tier per week
const MAINTENANCE_COST_BY_TIER: Record<number, number> = {
  1: 15,
  2: 25,
  3: 40,
  4: 50,
  5: 60,
};

// Tick maintenance health states based on current time vs maintenanceDue
export async function tickBuildingHealth(userId: string) {
  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: { where: { x: { gte: 0 } } } },
  });
  if (!city) return;

  const now = new Date();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const tenDaysMs = 10 * 24 * 60 * 60 * 1000;

  for (const b of city.buildings) {
    const due = new Date(b.maintenanceDue);
    const overdue = now.getTime() - due.getTime();

    let newHealth = b.health;

    if (overdue >= tenDaysMs) {
      newHealth = "collapsed";
      // Collapsed buildings lose their citizens
      if (b.health !== "collapsed") {
        await applyHappinessDelta(userId, -10);
      }
    } else if (overdue >= threeDaysMs) {
      newHealth = "deteriorating";
    } else if (overdue > 0 || (due.getTime() - now.getTime() <= threeDaysMs)) {
      newHealth = "due_soon";
    } else {
      newHealth = "healthy";
    }

    if (newHealth !== b.health) {
      await db.placedBuilding.update({
        where: { id: b.id },
        data: {
          health: newHealth,
          citizens: newHealth === "collapsed" ? 0 : b.citizens,
        },
      });
    }
  }
}

export async function payMaintenance(buildingId: string): Promise<{ success: boolean; cost?: number; error?: string }> {
  const userId = await requireAuth();

  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: { where: { id: buildingId } } },
  });
  if (!city || city.buildings.length === 0) return { success: false, error: "Building not found" };

  const building = city.buildings[0];
  const cost = MAINTENANCE_COST_BY_TIER[building.tier] ?? 15;

  const user = await db.user.findUnique({ where: { id: userId }, select: { gold: true } });
  if (!user) return { success: false, error: "User not found" };
  if (user.gold < cost) return { success: false, error: "Not enough gold", cost };

  await db.user.update({ where: { id: userId }, data: { gold: { decrement: cost } } });

  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + 7);

  await db.placedBuilding.update({
    where: { id: buildingId },
    data: {
      health: "healthy",
      maintenanceDue: nextDue,
      citizens: building.citizens === 0 && building.district === "residential" ? 5 : building.citizens,
    },
  });

  revalidatePath("/community");
  return { success: true, cost };
}

export async function getMaintenanceStatus() {
  const userId = await requireAuth();
  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: { where: { x: { gte: 0 } } } },
  });
  if (!city) return [];

  const now = new Date();
  return city.buildings.map((b) => {
    const due = new Date(b.maintenanceDue);
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const cost = MAINTENANCE_COST_BY_TIER[b.tier] ?? 15;
    return {
      id: b.id,
      name: b.name,
      icon: b.icon,
      health: b.health,
      maintenanceDue: b.maintenanceDue.toISOString(),
      daysUntilDue,
      cost,
      tier: b.tier,
    };
  }).sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}
