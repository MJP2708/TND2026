"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

const LOGIN_REWARDS = [
  { gold: 50,  xp: 0,   special: null             },
  { gold: 75,  xp: 20,  special: null             },
  { gold: 100, xp: 40,  special: "🌟 3-day streak!" },
  { gold: 125, xp: 50,  special: null             },
  { gold: 150, xp: 75,  special: null             },
  { gold: 200, xp: 100, special: null             },
  { gold: 350, xp: 150, special: "🏆 Weekly champion!" },
];

function todayKey() { return new Date().toISOString().slice(0, 10); }
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function claimLoginReward() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id;
  const today = todayKey();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lastLoginDate: true, loginStreak: true },
  });
  if (!user) return { error: "User not found" };

  if (user.lastLoginDate === today) return { alreadyClaimed: true };

  const yesterday = yesterdayKey();
  const newStreak = user.lastLoginDate === yesterday ? (user.loginStreak ?? 0) + 1 : 1;
  const def = LOGIN_REWARDS[Math.min(newStreak - 1, LOGIN_REWARDS.length - 1)];

  const updated = await db.user.update({
    where: { id: userId },
    data: { lastLoginDate: today, loginStreak: newStreak, gold: { increment: def.gold }, xp: { increment: def.xp } },
    select: { gold: true, xp: true },
  });

  return {
    claimed: true,
    gold: def.gold,
    xp: def.xp,
    special: def.special,
    streak: newStreak,
    newGold: updated.gold,
    newXp: updated.xp,
  };
}
