import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [user, activeGoal, moods, purchases, achievements, city] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.goal.findFirst({
      where: { userId, isActive: true },
      include: { tasks: { orderBy: { day: "asc" } } },
    }),
    db.moodCheckIn.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.purchase.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    db.userAchievement.findMany({ where: { userId }, include: { achievement: true } }),
    db.city.findUnique({ where: { userId }, include: { buildings: true } }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: user.id,
      displayName: user.displayName ?? user.name ?? "Student",
      email: user.email,
      gold: user.gold,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      focusMinutes: user.focusMinutes,
      houseLevel: user.houseLevel,
      lastActiveDate: user.lastActiveDate ?? "",
      lastMoodDate: user.lastMoodDate ?? "",
      themeMode: user.themeMode,
      uiTone: user.uiTone,
      language: user.language,
    },
    goal: activeGoal
      ? {
          id: activeGoal.id,
          title: activeGoal.title,
          deadline: activeGoal.deadline,
          dailyHours: activeGoal.dailyHours,
          energy: activeGoal.energy,
          difficulty: activeGoal.difficulty,
          category: activeGoal.category,
          createdAt: activeGoal.createdAt.toISOString(),
        }
      : null,
    tasks: (activeGoal?.tasks ?? []).map((t) => ({
      id: t.id,
      day: t.day,
      title: t.title,
      category: t.category,
      minutes: t.minutes,
      difficulty: t.difficulty,
      gold: t.gold,
      xp: t.xp,
      status: t.status,
      completion: t.completion,
      focusMinutes: t.focusMinutes,
      isRecovery: t.isRecovery,
    })),
    moods: moods.map((m) => ({
      id: m.id,
      date: m.date,
      tone: m.tone,
      answers: m.answers,
      goldAwarded: m.goldAwarded,
    })),
    purchasedItems: purchases.map((p) => p.itemId),
    unlockedAchievements: achievements.map((a) => a.achievement.key),
    city: city
      ? {
          id: city.id,
          name: city.name,
          buildings: city.buildings,
        }
      : null,
  });
}
