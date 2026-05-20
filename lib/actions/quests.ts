"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const DAILY_QUEST_DEFS = [
  { key: "complete_1_task",  title: "First Task",     description: "Complete 1 task today",              icon: "✅", goldReward: 30,  xpReward: 15, target: 1  },
  { key: "complete_3_tasks", title: "Task Trio",       description: "Complete 3 tasks today",             icon: "🎯", goldReward: 75,  xpReward: 40, target: 3  },
  { key: "focus_25min",      title: "Focus Starter",  description: "Accumulate 25 focus minutes",        icon: "⏱", goldReward: 50,  xpReward: 25, target: 25 },
  { key: "focus_60min",      title: "Deep Work",      description: "Accumulate 60 focus minutes today",  icon: "🔥", goldReward: 120, xpReward: 60, target: 60 },
  { key: "mood_checkin",     title: "Check In",       description: "Complete today's mood check-in",     icon: "💚", goldReward: 25,  xpReward: 10, target: 1  },
] as const;

type QuestKey = typeof DAILY_QUEST_DEFS[number]["key"];

function todayKey() { return new Date().toISOString().slice(0, 10); }

export async function getMyDailyQuests() {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = session.user.id;
  const today = todayKey();

  const records = await db.userDailyQuest.findMany({ where: { userId, dateKey: today } });

  return DAILY_QUEST_DEFS.map((def) => {
    const record = records.find((r) => r.questKey === def.key);
    return {
      ...def,
      progress: record?.progress ?? 0,
      completed: record?.completed ?? false,
      claimed: record?.claimed ?? false,
    };
  });
}

export async function updateQuestProgress(questKey: QuestKey, amount: number, userId: string) {
  const def = DAILY_QUEST_DEFS.find((d) => d.key === questKey);
  if (!def) return;
  const today = todayKey();

  try {
    const existing = await db.userDailyQuest.findUnique({
      where: { userId_questKey_dateKey: { userId, questKey, dateKey: today } },
    });

    if (existing?.completed) return;

    const newProgress = Math.min((existing?.progress ?? 0) + amount, def.target);
    const completed = newProgress >= def.target;

    await db.userDailyQuest.upsert({
      where: { userId_questKey_dateKey: { userId, questKey, dateKey: today } },
      create: { userId, questKey, dateKey: today, progress: newProgress, completed },
      update: { progress: newProgress, completed },
    });
  } catch { /* non-critical */ }
}

export async function claimQuestReward(questKey: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id;
  const today = todayKey();

  const record = await db.userDailyQuest.findUnique({
    where: { userId_questKey_dateKey: { userId, questKey, dateKey: today } },
  });

  if (!record?.completed) return { error: "Quest not completed" };
  if (record.claimed) return { error: "Already claimed" };

  const def = DAILY_QUEST_DEFS.find((d) => d.key === questKey);
  if (!def) return { error: "Quest not found" };

  await db.userDailyQuest.update({
    where: { id: record.id },
    data: { claimed: true, claimedAt: new Date() },
  });

  const user = await db.user.update({
    where: { id: userId },
    data: { gold: { increment: def.goldReward }, xp: { increment: def.xpReward } },
    select: { gold: true, xp: true },
  });

  return { success: true, goldReward: def.goldReward, xpReward: def.xpReward, newGold: user.gold, newXp: user.xp };
}
