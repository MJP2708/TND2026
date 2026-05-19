"use server";

import { db } from "@/lib/db";

const ACHIEVEMENT_DEFS = [
  { key: "first_focus",    name: "First Step",         description: "Complete your first focus session", icon: "⭐", goldReward: 100,  xpReward: 50  },
  { key: "streak_7",       name: "7 Day Streak",        description: "Maintain a 7-day focus streak",     icon: "🔥", goldReward: 250,  xpReward: 150 },
  { key: "tasks_10",       name: "Task Master",         description: "Complete 10 tasks",                 icon: "✅", goldReward: 200,  xpReward: 100 },
  { key: "first_building", name: "City Founder",        description: "Place your first building",         icon: "🏗", goldReward: 150,  xpReward: 75  },
  { key: "first_purchase", name: "Shopkeeper",          description: "Make your first shop purchase",     icon: "🛍", goldReward: 100,  xpReward: 50  },
  { key: "first_mood",     name: "Self-Aware",          description: "Complete your first mood check-in", icon: "💚", goldReward: 75,   xpReward: 30  },
  { key: "first_post",     name: "Community Member",    description: "Share your first post",             icon: "📣", goldReward: 100,  xpReward: 50  },
  { key: "focus_master",   name: "Focus Master",        description: "Accumulate 10+ hours of focus",     icon: "🏆", goldReward: 500,  xpReward: 300 },
  { key: "plan_complete",  name: "Plan Complete",       description: "Complete all tasks in a plan",      icon: "🌟", goldReward: 300,  xpReward: 200 },
];

export async function ensureAchievementsExist() {
  for (const def of ACHIEVEMENT_DEFS) {
    await db.achievement.upsert({
      where: { key: def.key },
      create: def,
      update: { name: def.name, description: def.description },
    });
  }
}

export async function checkAchievements(userId: string) {
  await ensureAchievementsExist();

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      tasks: { where: { status: "completed" } },
      focusSessions: true,
      moods: true,
      purchases: true,
      city: { include: { buildings: { where: { x: { gte: 0 } } } } },
      posts: true,
      achievements: { include: { achievement: true } },
    },
  });

  if (!user) return;

  const earned = new Set(user.achievements.map((a) => a.achievement.key));
  const toUnlock: string[] = [];

  if (!earned.has("first_focus") && user.focusSessions.length > 0) toUnlock.push("first_focus");
  if (!earned.has("streak_7") && user.streak >= 7) toUnlock.push("streak_7");
  if (!earned.has("tasks_10") && user.tasks.length >= 10) toUnlock.push("tasks_10");
  if (!earned.has("first_building") && (user.city?.buildings.length ?? 0) > 0) toUnlock.push("first_building");
  if (!earned.has("first_purchase") && user.purchases.length > 0) toUnlock.push("first_purchase");
  if (!earned.has("first_mood") && user.moods.length > 0) toUnlock.push("first_mood");
  if (!earned.has("first_post") && user.posts.length > 0) toUnlock.push("first_post");
  if (!earned.has("focus_master") && user.focusMinutes >= 600) toUnlock.push("focus_master");

  const allTasks = await db.task.findMany({ where: { userId, isRecovery: false } });
  const allDone = allTasks.length > 0 && allTasks.every((t) => t.status === "completed");
  if (!earned.has("plan_complete") && allDone) toUnlock.push("plan_complete");

  if (toUnlock.length === 0) return;

  const achievements = await db.achievement.findMany({ where: { key: { in: toUnlock } } });

  let totalGold = 0;
  let totalXp = 0;

  for (const ach of achievements) {
    await db.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: ach.id } },
      create: { userId, achievementId: ach.id },
      update: {},
    });
    totalGold += ach.goldReward;
    totalXp += ach.xpReward;
  }

  if (totalGold > 0 || totalXp > 0) {
    await db.user.update({
      where: { id: userId },
      data: {
        gold: { increment: totalGold },
        xp: { increment: totalXp },
      },
    });
  }
}

export async function getUserAchievements(userId: string) {
  const all = ACHIEVEMENT_DEFS;
  const unlocked = await db.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
  });
  const unlockedKeys = new Set(unlocked.map((u) => u.achievement.key));

  return all.map((def) => ({
    ...def,
    unlocked: unlockedKeys.has(def.key),
    unlockedAt: unlocked.find((u) => u.achievement.key === def.key)?.unlockedAt,
  }));
}
