"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

function calcFromTime(lastTime: Date | null, hoursToEmpty: number): number {
  if (!lastTime) return 30;
  const hoursElapsed = (Date.now() - lastTime.getTime()) / (1000 * 60 * 60);
  return Math.max(0, Math.min(100, Math.round(100 - (hoursElapsed / hoursToEmpty) * 100)));
}

function companionMood(hunger: number, happiness: number, energy: number): string {
  const avg = (hunger + happiness + energy) / 3;
  if (avg > 70) return "happy";
  if (avg > 40) return "idle";
  return "tired";
}

export async function getMyCompanion() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const raw = await db.companion.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });

  const hunger    = calcFromTime(raw.lastFed,    12); // 100→0 in 12h
  const happiness = calcFromTime(raw.lastPetted, 16); // 100→0 in 16h
  const energy    = calcFromTime(raw.lastActive, 24); // 100→0 in 24h

  return {
    id: raw.id,
    friendship: raw.friendship,
    friendshipLevel: Math.floor(raw.friendship / 100) + 1,
    skin: raw.skin,
    hunger,
    happiness,
    energy,
    mood: companionMood(hunger, happiness, energy) as "happy" | "idle" | "tired",
  };
}

export async function petCompanion() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const updated = await db.companion.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, lastPetted: new Date(), friendship: 3 },
    update: { lastPetted: new Date(), friendship: { increment: 3 } },
    select: { friendship: true },
  });

  return { success: true, friendship: Math.min(1000, updated.friendship) };
}

export async function feedCompanion() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { gold: true },
  });
  if (!user || user.gold < 10) return { error: "Not enough gold" };

  await db.user.update({ where: { id: session.user.id }, data: { gold: { decrement: 10 } } });

  await db.companion.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, lastFed: new Date(), friendship: 2 },
    update: { lastFed: new Date(), friendship: { increment: 2 } },
  });

  return { success: true, goldSpent: 10, newGold: user.gold - 10 };
}

export async function boostCompanionFromActivity(userId: string, type: "focus" | "task" | "mood") {
  const friendshipInc = type === "focus" ? 5 : type === "task" ? 3 : 2;
  try {
    await db.companion.upsert({
      where: { userId },
      create: { userId, lastActive: new Date(), friendship: friendshipInc },
      update: { lastActive: new Date(), friendship: { increment: friendshipInc } },
    });
  } catch { /* non-critical */ }
}
