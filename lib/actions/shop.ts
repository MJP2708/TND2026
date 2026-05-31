"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { checkAchievements } from "./achievements";
import { checkEraProgression, applyHappinessDelta } from "./game-state";
import type { EraType, DistrictType } from "@/lib/types";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export type CatalogItem = {
  name: string;
  icon: string;
  energyCost: number;
  goldCost: number;
  category: string;
  era: EraType;
  district: DistrictType;
  tier: number;
  isBuilding: boolean;
  passiveDesc: string;
};

export const ITEM_CATALOG: Record<string, CatalogItem> = {
  // ── Pioneer era buildings ─────────────────────────────────────
  cottage:    { name: "Cottage",       icon: "🏠", energyCost: 80,  goldCost: 60,  category: "Residential", era: "pioneer",    district: "residential", tier: 1, isBuilding: true, passiveDesc: "+5 Gold/hr" },
  farm:       { name: "Farm",          icon: "🌾", energyCost: 100, goldCost: 50,  category: "Industrial",  era: "pioneer",    district: "industrial",  tier: 1, isBuilding: true, passiveDesc: "+3 Energy/hr" },
  market:     { name: "Market",        icon: "🏪", energyCost: 120, goldCost: 80,  category: "Knowledge",   era: "pioneer",    district: "knowledge",   tier: 1, isBuilding: true, passiveDesc: "+1 Gold/hr" },
  campfire:   { name: "Campfire",      icon: "🔥", energyCost: 50,  goldCost: 40,  category: "Green",       era: "pioneer",    district: "green",       tier: 1, isBuilding: true, passiveDesc: "+3 Happiness" },
  park:       { name: "Park",          icon: "🌳", energyCost: 70,  goldCost: 55,  category: "Green",       era: "pioneer",    district: "green",       tier: 1, isBuilding: true, passiveDesc: "+3 Happiness" },
  fountain:   { name: "Fountain",      icon: "⛲", energyCost: 120, goldCost: 180, category: "Green",       era: "pioneer",    district: "green",       tier: 1, isBuilding: true, passiveDesc: "+3 Happiness" },
  garden:     { name: "Garden",        icon: "🌸", energyCost: 90,  goldCost: 70,  category: "Green",       era: "pioneer",    district: "green",       tier: 1, isBuilding: true, passiveDesc: "+3 Happiness" },
  // ── Modern era buildings ──────────────────────────────────────
  office:     { name: "Office",        icon: "🏢", energyCost: 200, goldCost: 150, category: "Industrial",  era: "modern",     district: "industrial",  tier: 2, isBuilding: true, passiveDesc: "+6 Energy/hr" },
  gym:        { name: "Gym",           icon: "💪", energyCost: 180, goldCost: 120, category: "Green",       era: "modern",     district: "green",       tier: 2, isBuilding: true, passiveDesc: "+3 Happiness" },
  cafe:       { name: "Café",          icon: "☕", energyCost: 160, goldCost: 130, category: "Residential", era: "modern",     district: "residential", tier: 2, isBuilding: true, passiveDesc: "+10 Gold/hr" },
  apartment:  { name: "Apartment",     icon: "🏘", energyCost: 220, goldCost: 160, category: "Residential", era: "modern",     district: "residential", tier: 2, isBuilding: true, passiveDesc: "+10 Gold/hr" },
  library:    { name: "Library",       icon: "📚", energyCost: 200, goldCost: 150, category: "Knowledge",   era: "modern",     district: "knowledge",   tier: 2, isBuilding: true, passiveDesc: "+XP bonus" },
  // ── Metropolis era buildings ──────────────────────────────────
  techlab:    { name: "Tech Lab",      icon: "🔬", energyCost: 400, goldCost: 300, category: "Knowledge",   era: "metropolis", district: "knowledge",   tier: 3, isBuilding: true, passiveDesc: "+XP bonus" },
  skygarden:  { name: "Sky Garden",    icon: "🌿", energyCost: 350, goldCost: 250, category: "Green",       era: "metropolis", district: "green",       tier: 3, isBuilding: true, passiveDesc: "+5 Happiness" },
  aicenter:   { name: "AI Center",     icon: "🤖", energyCost: 500, goldCost: 400, category: "Knowledge",   era: "metropolis", district: "knowledge",   tier: 3, isBuilding: true, passiveDesc: "+XP bonus" },
  skyscraper: { name: "Skyscraper",    icon: "🏙", energyCost: 600, goldCost: 500, category: "Industrial",  era: "metropolis", district: "industrial",  tier: 3, isBuilding: true, passiveDesc: "+9 Energy/hr" },
  // ── Legacy items (gold-only for backward compat) ──────────────
  desk:       { name: "Study Desk",    icon: "🪑", energyCost: 0,   goldCost: 450, category: "Buildings",   era: "pioneer",    district: "knowledge",   tier: 1, isBuilding: true, passiveDesc: "+1 Gold/hr" },
  shelf:      { name: "Bookshelf",     icon: "📚", energyCost: 0,   goldCost: 350, category: "Buildings",   era: "pioneer",    district: "knowledge",   tier: 1, isBuilding: true, passiveDesc: "+1 Gold/hr" },
  plant:      { name: "Plant",         icon: "🌿", energyCost: 0,   goldCost: 200, category: "Buildings",   era: "pioneer",    district: "green",       tier: 1, isBuilding: true, passiveDesc: "+1 Happiness" },
  lamp:       { name: "Lamp",          icon: "💡", energyCost: 0,   goldCost: 150, category: "Buildings",   era: "pioneer",    district: "green",       tier: 1, isBuilding: true, passiveDesc: "+1 Happiness" },
  sofa:       { name: "Sofa",          icon: "🛋️", energyCost: 0,   goldCost: 600, category: "Buildings",   era: "pioneer",    district: "residential", tier: 1, isBuilding: true, passiveDesc: "+5 Gold/hr" },
  board:      { name: "Whiteboard",    icon: "📋", energyCost: 0,   goldCost: 300, category: "Buildings",   era: "pioneer",    district: "knowledge",   tier: 1, isBuilding: true, passiveDesc: "+1 Gold/hr" },
  trophy:     { name: "Trophy",        icon: "🏆", energyCost: 0,   goldCost: 800, category: "Decor",       era: "pioneer",    district: "residential", tier: 1, isBuilding: true, passiveDesc: "+3 Happiness" },
  flag:       { name: "Goal Flag",     icon: "🚩", energyCost: 0,   goldCost: 250, category: "Decor",       era: "pioneer",    district: "residential", tier: 1, isBuilding: true, passiveDesc: "+2 Happiness" },
  stars:      { name: "Star Lights",   icon: "⭐", energyCost: 0,   goldCost: 400, category: "Decor",       era: "pioneer",    district: "green",       tier: 1, isBuilding: true, passiveDesc: "+2 Happiness" },
  art:        { name: "Mural",         icon: "🎨", energyCost: 0,   goldCost: 700, category: "Decor",       era: "pioneer",    district: "green",       tier: 1, isBuilding: true, passiveDesc: "+3 Happiness" },
  // ── Upgrade items (non-building, gold-only) ───────────────────
  xp2:        { name: "XP Booster",   icon: "⚡", energyCost: 0,   goldCost: 300, category: "Upgrades",    era: "pioneer",    district: "residential", tier: 1, isBuilding: false, passiveDesc: "" },
  gold2:      { name: "Gold Rush",    icon: "🪙", energyCost: 0,   goldCost: 200, category: "Upgrades",    era: "pioneer",    district: "residential", tier: 1, isBuilding: false, passiveDesc: "" },
  timer:      { name: "Focus Power",  icon: "⏰", energyCost: 0,   goldCost: 500, category: "Upgrades",    era: "pioneer",    district: "residential", tier: 1, isBuilding: false, passiveDesc: "" },
  streak:     { name: "Streak Shield",icon: "🛡️", energyCost: 0,   goldCost: 750, category: "Upgrades",    era: "pioneer",    district: "residential", tier: 1, isBuilding: false, passiveDesc: "" },
  hint:       { name: "AI Hint",      icon: "🤖", energyCost: 0,   goldCost: 100, category: "Upgrades",    era: "pioneer",    district: "residential", tier: 1, isBuilding: false, passiveDesc: "" },
  rest:       { name: "Rest Pass",    icon: "😴", energyCost: 0,   goldCost: 400, category: "Upgrades",    era: "pioneer",    district: "residential", tier: 1, isBuilding: false, passiveDesc: "" },
};

// Maintenance cost per tier: used in city actions
export const MAINTENANCE_COST_BY_TIER: Record<number, number> = { 1: 15, 2: 25, 3: 40, 4: 50, 5: 60 };

export async function buyItem(itemId: string) {
  const userId = await requireAuth();

  const item = ITEM_CATALOG[itemId];
  if (!item) return { error: "Item not found" };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  const gs = await db.gameState.findUnique({ where: { userId } });
  const currentEra = (gs?.currentEra ?? "pioneer") as EraType;
  const ERA_ORDER: EraType[] = ["pioneer", "modern", "metropolis"];
  const itemEraIdx = ERA_ORDER.indexOf(item.era);
  const userEraIdx = ERA_ORDER.indexOf(currentEra);

  if (itemEraIdx > userEraIdx) {
    return { error: `Unlocks in ${item.era === "modern" ? "Modern City" : "Metropolis"} era` };
  }

  // Apply construction discount if active
  const hasDiscount = gs?.constructionDiscount ?? false;
  const discountFactor = hasDiscount ? 0.5 : 1.0;

  const requiredEnergy = Math.ceil(item.energyCost * discountFactor);
  const requiredGold = Math.ceil(item.goldCost * discountFactor);

  if (user.energy < requiredEnergy) {
    return { error: "Not enough Energy ⚡", needed: requiredEnergy, have: user.energy };
  }
  if (user.gold < requiredGold) {
    return { error: "Not enough Gold 🪙", needed: requiredGold, have: user.gold };
  }

  await db.user.update({
    where: { id: userId },
    data: {
      energy: { decrement: requiredEnergy },
      gold: { decrement: requiredGold },
    },
  });

  const purchase = await db.purchase.create({
    data: { userId, itemId, itemName: item.name, category: item.category, cost: requiredGold },
  });

  if (item.isBuilding) {
    const city = await db.city.upsert({ where: { userId }, create: { userId }, update: {} });
    const nextMaintenance = new Date();
    nextMaintenance.setDate(nextMaintenance.getDate() + 7);

    await db.placedBuilding.create({
      data: {
        cityId: city.id,
        itemId,
        name: item.name,
        icon: item.icon,
        category: item.category,
        district: item.district,
        tier: item.tier,
        health: "healthy",
        maintenanceDue: nextMaintenance,
        citizens: item.district === "residential" ? 5 : 0,
        x: -1,
        y: -1,
      },
    });

    // Increment totalBuilt and check era progression
    const totalBuilt = (gs?.totalBuilt ?? 0) + 1;
    await db.gameState.upsert({
      where: { userId },
      create: { userId, totalBuilt, constructionDiscount: false },
      update: { totalBuilt, constructionDiscount: false },
    });

    // Happiness +3 for decorations
    if (item.category === "Decor" || item.district === "green") {
      await applyHappinessDelta(userId, 3);
    }

    await checkEraProgression(userId);
  }

  // Clear construction discount after use
  if (hasDiscount) {
    await db.gameState.upsert({
      where: { userId },
      create: { userId, constructionDiscount: false },
      update: { constructionDiscount: false },
    });
  }

  await checkAchievements(userId);
  revalidatePath("/rewards");
  revalidatePath("/community");

  return {
    success: true,
    purchaseId: purchase.id,
    newGold: user.gold - requiredGold,
    newEnergy: user.energy - requiredEnergy,
  };
}

export async function getPurchases() {
  const userId = await requireAuth();
  return db.purchase.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export async function getInventory() {
  const userId = await requireAuth();
  const city = await db.city.findUnique({ where: { userId } });
  if (!city) return [];
  return db.placedBuilding.findMany({
    where: { cityId: city.id, x: -1 },
    orderBy: { placedAt: "desc" },
  });
}
