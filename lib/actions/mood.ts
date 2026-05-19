"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkAchievements } from "./achievements";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const MOOD_GOLD = 50;

export async function saveMoodCheckIn(mood: string, isBurnout: boolean) {
  const userId = await requireAuth();

  const today = new Date().toISOString().slice(0, 10);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  // One reward per day
  if (user.lastMoodDate === today) {
    return { error: "Already checked in today" };
  }

  const tone = isBurnout
    ? "overloaded"
    : mood === "Great" || mood === "Good"
    ? "rested"
    : mood === "Tired"
    ? "tired"
    : "steady";

  await db.moodCheckIn.create({
    data: {
      userId,
      tone,
      answers: [mood],
      goldAwarded: MOOD_GOLD,
      date: today,
    },
  });

  await db.user.update({
    where: { id: userId },
    data: {
      gold: { increment: MOOD_GOLD },
      lastMoodDate: today,
    },
  });

  await checkAchievements(userId);
  revalidatePath("/mood");
  revalidatePath("/progress");

  return { gold: MOOD_GOLD };
}

export async function getMoodHistory() {
  const userId = await requireAuth();
  return db.moodCheckIn.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}
