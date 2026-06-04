"use server";

import { requireAuth } from "./require-auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { DailyEvent, EventChoice, SpecialCitizen, SpecialCitizenType, EraType } from "@/lib/types";
import { getHappinessMultiplier, STREAK_MILESTONES as MILESTONES } from "@/lib/game-utils";

function clampHappiness(h: number) {
  return Math.max(0, Math.min(100, h));
}

async function getOrCreateGameState(userId: string) {
  return db.gameState.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

// ── Happiness deltas ──────────────────────────────────────────────────────────

export async function applyHappinessDelta(userId: string, delta: number) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { happiness: true } });
  if (!user) return;
  await db.user.update({
    where: { id: userId },
    data: { happiness: clampHappiness((user.happiness ?? 50) + delta) },
  });
}

export async function checkDailyHappiness(userId: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().slice(0, 10);

  // Count completed tasks yesterday
  const completedYesterday = await db.task.count({
    where: { userId, day: yStr, status: "completed" },
  });

  if (completedYesterday === 0) {
    await applyHappinessDelta(userId, -8);
  }

  // Check deteriorating buildings
  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: { where: { health: "deteriorating", x: { gte: 0 } } } },
  });
  if (city && city.buildings.length > 0) {
    await applyHappinessDelta(userId, -15 * city.buildings.length);
  }
}

// ── Passive income tick ───────────────────────────────────────────────────────

export async function calculatePassiveIncome(userId: string): Promise<{ gold: number; energy: number; hours: number } | null> {
  const gs = await getOrCreateGameState(userId);
  const user = await db.user.findUnique({ where: { id: userId }, select: { happiness: true } });

  const now = new Date();
  const lastLogin = new Date(gs.lastLoginAt);
  const elapsedMs = now.getTime() - lastLogin.getTime();
  const elapsedHours = Math.min(elapsedMs / (1000 * 60 * 60), 8); // cap at 8h

  if (elapsedHours < 0.1) {
    // Update lastLoginAt and return null (no meaningful income)
    await db.gameState.update({ where: { userId }, data: { lastLoginAt: now } });
    return null;
  }

  const city = await db.city.findUnique({
    where: { userId },
    include: { buildings: { where: { x: { gte: 0 }, health: { not: "collapsed" } } } },
  });

  const happiness = user?.happiness ?? 50;
  const multiplier = getHappinessMultiplier(happiness);
  const gsMultiplier = gs.prestigeMultiplier;

  let goldPerHour = 0;
  let energyPerHour = 0;

  if (city) {
    for (const b of city.buildings) {
      const passiveRates = PASSIVE_RATES[b.district as string] ?? { gold: 0, energy: 0 };
      const tierBonus = b.tier;
      goldPerHour += passiveRates.gold * tierBonus * (b.citizens > 0 ? 1 + b.citizens * 0.1 : 1);
      energyPerHour += passiveRates.energy * tierBonus;
    }
  }

  const rawGold = Math.floor(goldPerHour * elapsedHours * multiplier * gsMultiplier);
  const rawEnergy = Math.floor(energyPerHour * elapsedHours * multiplier * gsMultiplier);

  if (rawGold > 0 || rawEnergy > 0) {
    await db.user.update({
      where: { id: userId },
      data: {
        gold: { increment: rawGold },
        energy: { increment: rawEnergy },
      },
    });
  }

  await db.gameState.update({
    where: { userId },
    data: { lastLoginAt: now },
  });

  return rawGold > 0 || rawEnergy > 0
    ? { gold: rawGold, energy: rawEnergy, hours: Math.round(elapsedHours * 10) / 10 }
    : null;
}

const PASSIVE_RATES: Record<string, { gold: number; energy: number }> = {
  residential: { gold: 5, energy: 0 },
  industrial:  { gold: 0, energy: 3 },
  green:       { gold: 1, energy: 1 },
  knowledge:   { gold: 1, energy: 0 },
};

// ── Era progression ───────────────────────────────────────────────────────────

export async function checkEraProgression(userId: string): Promise<EraType | null> {
  const gs = await getOrCreateGameState(userId);
  const user = await db.user.findUnique({ where: { id: userId }, select: { streak: true } });

  const currentEra = gs.currentEra as EraType;
  const totalBuilt = gs.totalBuilt;
  const streak = user?.streak ?? 0;

  let newEra: EraType | null = null;

  if (currentEra === "pioneer" && totalBuilt >= 10) {
    newEra = "modern";
  } else if (currentEra === "modern" && totalBuilt >= 25 && streak >= 30) {
    newEra = "metropolis";
  }

  if (newEra) {
    await db.gameState.update({
      where: { userId },
      data: { currentEra: newEra },
    });
    await applyHappinessDelta(userId, 20);
    revalidatePath("/community");
  }

  return newEra;
}

// ── Streak milestone rewards ──────────────────────────────────────────────────

export async function applyStreakMilestoneReward(userId: string, newStreak: number) {
  const milestone = MILESTONES.find((m) => m.days === newStreak);
  if (!milestone) return;

  switch (newStreak) {
    case 3:
      await db.user.update({ where: { id: userId }, data: { gold: { increment: 50 } } });
      break;
    case 7:
      await grantSpecialCitizen(userId, "scholar");
      break;
    case 14:
      await grantSpecialCitizen(userId, "architect");
      await db.user.update({ where: { id: userId }, data: { gold: { increment: 100 } } });
      break;
    case 21:
      await db.user.update({
        where: { id: userId },
        data: { energy: { increment: 200 }, gold: { increment: 200 } },
      });
      break;
    case 30:
      // Grant the prestige monument building
      await unlockPrestigeMonument(userId);
      break;
  }
}

async function grantSpecialCitizen(userId: string, type: SpecialCitizenType) {
  const gs = await getOrCreateGameState(userId);
  const existing = gs.specialCitizens as SpecialCitizen[];

  const alreadyHas = existing.some((c) => c.type === type);
  if (alreadyHas) return;

  const CITIZEN_DEFS: Record<SpecialCitizenType, Omit<SpecialCitizen, "id" | "assignedTo" | "expiresAt">> = {
    scholar:   { type: "scholar",   name: "The Scholar",   bonus: "+10% XP from tasks" },
    merchant:  { type: "merchant",  name: "The Merchant",  bonus: "+15% Gold from tasks" },
    architect: { type: "architect", name: "The Architect", bonus: "Next building costs 50% less" },
    healer:    { type: "healer",    name: "The Healer",    bonus: "Happiness decay -50% for 3 days" },
  };

  const def = CITIZEN_DEFS[type];
  const newCitizen: SpecialCitizen = {
    ...def,
    id: `sc-${type}-${Date.now()}`,
    assignedTo: null,
    expiresAt: null,
  };

  await db.gameState.update({
    where: { userId },
    data: { specialCitizens: [...existing, newCitizen] },
  });
}

async function unlockPrestigeMonument(userId: string) {
  const city = await db.city.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  // Add the monument to inventory
  await db.placedBuilding.create({
    data: {
      cityId: city.id,
      itemId: "monument",
      name: "Monument",
      icon: "🏛",
      category: "Prestige",
      district: "green",
      tier: 3,
      health: "healthy",
      maintenanceDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      citizens: 0,
      x: -1,
      y: -1,
    },
  });
}

// ── Daily events ──────────────────────────────────────────────────────────────

const EVENT_POOL: DailyEvent[] = [
  {
    type: "heavy_rain",
    title: "Heavy Rain ☔",
    icon: "🌧",
    description: "Citizens are staying indoors. Morale is dipping.",
    choices: [
      { label: "Fund shelter", description: "Pay 30 Gold to boost morale", effect: { gold: -30, happiness: 15 } },
      { label: "Ignore it",   description: "Morale suffers naturally",     effect: { happiness: -5 } },
    ],
  },
  {
    type: "visiting_architect",
    title: "Visiting Architect 🏗",
    icon: "📐",
    description: "A renowned architect is passing through your city and offers to consult.",
    choices: [
      { label: "Hire them",  description: "Pay 50 Gold — next build is free", effect: { gold: -50, constructionDiscount: true } },
      { label: "Pass",       description: "Miss the opportunity",              effect: {} },
    ],
  },
  {
    type: "construction_rush",
    title: "Construction Rush 🏗",
    icon: "⚒",
    description: "A materials surplus means any building costs 50% less today.",
    choices: [
      { label: "Accept discount", description: "50% off your next building",   effect: { constructionDiscount: true } },
      { label: "Skip",            description: "No discount applied",           effect: {} },
    ],
  },
  {
    type: "graduation_day",
    title: "Graduation Day 🎓",
    icon: "🎓",
    description: "Complete 5 tasks today to earn a Scholar citizen.",
    choices: [
      { label: "Accept challenge", description: "Complete 5 tasks → Scholar",  effect: { challengeKey: "graduation_5tasks" } },
      { label: "Skip",             description: "Pass on the challenge",         effect: {} },
    ],
  },
  {
    type: "market_boom",
    title: "Market Boom 📈",
    icon: "💰",
    description: "The economy is thriving! Citizens are spending freely.",
    choices: [
      { label: "Invest (50 Gold)", description: "+80 Gold return",             effect: { gold: -50 } },
      { label: "Cash in",          description: "+30 Gold immediately",         effect: { gold: 30 } },
    ],
  },
  {
    type: "energy_surge",
    title: "Energy Surge ⚡",
    icon: "⚡",
    description: "A wave of productivity energy flows through the city.",
    choices: [
      { label: "Channel it",  description: "+60 Energy, -5 Happiness",         effect: { energy: 60, happiness: -5 } },
      { label: "Let it pass", description: "+15 Happiness",                     effect: { happiness: 15 } },
    ],
  },
  {
    type: "community_festival",
    title: "Community Festival 🎉",
    icon: "🎊",
    description: "Citizens want to throw a festival. It will cost some Gold but greatly boost morale.",
    choices: [
      { label: "Host festival", description: "Pay 40 Gold → +20 Happiness",    effect: { gold: -40, happiness: 20 } },
      { label: "Postpone",      description: "Small happiness boost later",     effect: { happiness: 3 } },
    ],
  },
  {
    type: "tax_break",
    title: "Tax Break 🏛",
    icon: "📜",
    description: "The government is offering a tax rebate for productive cities.",
    choices: [
      { label: "Claim rebate",  description: "+50 Gold refund",                effect: { gold: 50 } },
      { label: "Donate it",     description: "+20 Happiness from goodwill",    effect: { happiness: 20 } },
    ],
  },
  {
    type: "merchant_visit",
    title: "Travelling Merchant 🛒",
    icon: "🧑‍💼",
    description: "A merchant arrives with rare goods and is looking for a city to settle in.",
    choices: [
      { label: "Invite them",  description: "Earn the Merchant special citizen", effect: { specialCitizen: "merchant" } },
      { label: "Decline",      description: "They move on",                       effect: {} },
    ],
  },
  {
    type: "healer_arrival",
    title: "Healer in Town 💊",
    icon: "🏥",
    description: "A healer has arrived and offers services to your citizens.",
    choices: [
      { label: "Welcome them", description: "Happiness decay -50% for 3 days", effect: { specialCitizen: "healer" } },
      { label: "Pass",         description: "The healer moves on",               effect: {} },
    ],
  },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export async function getTodayEvent(userId: string): Promise<DailyEvent | null> {
  const today = new Date().toISOString().slice(0, 10);
  const gs = await getOrCreateGameState(userId);

  if (gs.todayEventDate === today && gs.todayEvent) {
    return gs.todayEvent as DailyEvent;
  }

  // Generate deterministically from date + userId
  const seed = hashString(`${today}:${userId}`);
  const event = EVENT_POOL[seed % EVENT_POOL.length];

  await db.gameState.update({
    where: { userId },
    data: { todayEvent: event, todayEventDate: today },
  });

  return event;
}

export async function resolveEvent(choiceIndex: number): Promise<{ success: boolean; effect: EventChoice["effect"] }> {
  const userId = await requireAuth();
  const today = new Date().toISOString().slice(0, 10);
  const gs = await getOrCreateGameState(userId);

  if (gs.todayEventDate !== today || !gs.todayEvent) {
    return { success: false, effect: {} };
  }

  const event = gs.todayEvent as DailyEvent;
  if (!event.choices[choiceIndex]) return { success: false, effect: {} };

  const choice = event.choices[choiceIndex];
  const effect = choice.effect;

  const user = await db.user.findUnique({ where: { id: userId }, select: { gold: true, energy: true } });
  if (!user) return { success: false, effect: {} };

  const goldDelta = effect.gold ?? 0;
  const energyDelta = effect.energy ?? 0;
  const happinessDelta = effect.happiness ?? 0;

  // Don't let gold go negative
  if (user.gold + goldDelta < 0) {
    return { success: false, effect: {} };
  }

  const updates: Record<string, unknown> = {};
  if (goldDelta !== 0) updates.gold = { increment: goldDelta };
  if (energyDelta !== 0) updates.energy = { increment: energyDelta };

  if (Object.keys(updates).length > 0) {
    await db.user.update({ where: { id: userId }, data: updates });
  }

  if (happinessDelta !== 0) {
    await applyHappinessDelta(userId, happinessDelta);
  }

  if (effect.specialCitizen) {
    await grantSpecialCitizen(userId, effect.specialCitizen);
  }

  // Record in history, mark event resolved
  const existingHistory = Array.isArray(gs.eventHistory) ? gs.eventHistory : [];
  const newHistory = JSON.parse(JSON.stringify([
    ...existingHistory,
    { date: today, type: event.type, choiceIndex, outcome: effect },
  ]));
  await db.gameState.update({
    where: { userId },
    data: {
      todayEvent: { set: null },
      constructionDiscount: effect.constructionDiscount ?? gs.constructionDiscount ?? false,
      eventHistory: newHistory,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/community");
  return { success: true, effect };
}

// ── Prestige ──────────────────────────────────────────────────────────────────

export async function checkPrestigeEligibility(userId: string): Promise<boolean> {
  const gs = await getOrCreateGameState(userId);
  const user = await db.user.findUnique({ where: { id: userId }, select: { streak: true } });

  return gs.currentEra === "metropolis" && gs.totalBuilt >= 25 && (user?.streak ?? 0) >= 1;
}

export async function performPrestige(): Promise<{ success: boolean; prestigeCount: number }> {
  const userId = await requireAuth();
  const eligible = await checkPrestigeEligibility(userId);
  if (!eligible) return { success: false, prestigeCount: 0 };

  const gs = await getOrCreateGameState(userId);
  const newPrestigeCount = gs.prestigeCount + 1;
  const newMultiplier = 1.0 + newPrestigeCount * 0.1;

  // Clear all city buildings except prestige buildings
  const city = await db.city.findUnique({ where: { userId }, include: { buildings: true } });
  if (city) {
    const keepIds = city.buildings
      .filter((b) => b.category === "Prestige")
      .map((b) => b.id);
    await db.placedBuilding.deleteMany({
      where: { cityId: city.id, id: { notIn: keepIds } },
    });
  }

  // Reset user resources but keep multiplier
  await db.user.update({
    where: { id: userId },
    data: { gold: 500, energy: 100 },
  });

  // Update game state
  await db.gameState.update({
    where: { userId },
    data: {
      currentEra: "pioneer",
      prestigeCount: newPrestigeCount,
      prestigeMultiplier: newMultiplier,
      totalBuilt: 0,
    },
  });

  // Grant prestige building
  await unlockPrestigeBuilding(userId, newPrestigeCount);

  revalidatePath("/community");
  revalidatePath("/progress");
  return { success: true, prestigeCount: newPrestigeCount };
}

async function unlockPrestigeBuilding(userId: string, tier: number) {
  const prestige_buildings: Record<number, { name: string; icon: string }> = {
    1: { name: "Golden Tower",   icon: "🗼" },
    2: { name: "Crystal Palace", icon: "💎" },
    3: { name: "Celestial Arch", icon: "🌉" },
  };
  const def = prestige_buildings[Math.min(tier, 3)] ?? prestige_buildings[1];

  const city = await db.city.upsert({ where: { userId }, create: { userId }, update: {} });
  await db.placedBuilding.create({
    data: {
      cityId: city.id,
      itemId: `prestige_${tier}`,
      name: def.name,
      icon: def.icon,
      category: "Prestige",
      district: "residential",
      tier: 5,
      health: "healthy",
      maintenanceDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      citizens: 10,
      x: -1,
      y: -1,
    },
  });
}
