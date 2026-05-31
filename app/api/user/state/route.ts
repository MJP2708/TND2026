import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { calculatePassiveIncome, getTodayEvent, checkDailyHappiness } from "@/lib/actions/game-state";
import { tickBuildingHealth as tickHealth } from "@/lib/actions/maintenance";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Run passive income + health ticks (non-blocking side effects)
  const [passiveIncome] = await Promise.allSettled([
    calculatePassiveIncome(userId),
    checkDailyHappiness(userId),
    tickHealth(userId),
  ]);

  const pendingPassiveIncome =
    passiveIncome.status === "fulfilled" ? passiveIncome.value : null;

  // Load today's event (creates if needed)
  await getTodayEvent(userId).catch(() => null);

  const [user, activeGoal, moods, purchases, achievements, city, gameState] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.goal.findFirst({
      where: { userId, isActive: true },
      include: { tasks: { orderBy: { day: "asc" } } },
    }),
    db.moodCheckIn.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.purchase.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    db.userAchievement.findMany({ where: { userId }, include: { achievement: true } }),
    db.city.findUnique({ where: { userId }, include: { buildings: true } }),
    db.gameState.findUnique({ where: { userId } }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: user.id,
      displayName: user.displayName ?? user.name ?? "Student",
      email: user.email,
      gold: user.gold,
      energy: user.energy,
      xp: user.xp,
      level: user.level,
      streak: user.streak,
      focusMinutes: user.focusMinutes,
      houseLevel: user.houseLevel,
      happiness: user.happiness,
      lastActiveDate: user.lastActiveDate ?? "",
      lastMoodDate: user.lastMoodDate ?? "",
      themeMode: user.themeMode,
      uiTone: user.uiTone,
      language: user.language,
    },
    gameState: gameState
      ? {
          currentEra: gameState.currentEra,
          prestigeCount: gameState.prestigeCount,
          prestigeMultiplier: gameState.prestigeMultiplier,
          lastLoginAt: gameState.lastLoginAt.toISOString(),
          specialCitizens: gameState.specialCitizens,
          todayEvent: gameState.todayEvent,
          todayEventDate: gameState.todayEventDate,
          totalBuilt: gameState.totalBuilt,
          constructionDiscount: (gameState as { constructionDiscount?: boolean }).constructionDiscount ?? false,
          pendingPassiveIncome,
        }
      : {
          currentEra: "pioneer",
          prestigeCount: 0,
          prestigeMultiplier: 1.0,
          lastLoginAt: new Date().toISOString(),
          specialCitizens: [],
          todayEvent: null,
          todayEventDate: "",
          totalBuilt: 0,
          constructionDiscount: false,
          pendingPassiveIncome,
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
          buildings: city.buildings.map((b) => ({
            id: b.id,
            itemId: b.itemId,
            name: b.name,
            icon: b.icon,
            category: b.category,
            x: b.x,
            y: b.y,
            rotation: b.rotation,
            level: b.level,
            district: b.district,
            tier: b.tier,
            health: b.health,
            maintenanceDue: b.maintenanceDue.toISOString(),
            citizens: b.citizens,
            constructedAt: b.constructedAt.toISOString(),
          })),
        }
      : null,
  });
}
