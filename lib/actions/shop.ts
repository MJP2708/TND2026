"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { checkAchievements } from "./achievements";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// All shop items with server-side price registry (prevents price manipulation)
const ITEM_CATALOG: Record<string, { name: string; icon: string; cost: number; category: string; isBuilding: boolean }> = {
  desk:     { name: "Study Desk",   icon: "🪑", cost: 450,  category: "Buildings", isBuilding: true  },
  shelf:    { name: "Bookshelf",    icon: "📚", cost: 350,  category: "Buildings", isBuilding: true  },
  plant:    { name: "Plant",        icon: "🌿", cost: 200,  category: "Buildings", isBuilding: true  },
  lamp:     { name: "Lamp",         icon: "💡", cost: 150,  category: "Buildings", isBuilding: true  },
  sofa:     { name: "Sofa",         icon: "🛋️", cost: 600,  category: "Buildings", isBuilding: true  },
  board:    { name: "Whiteboard",   icon: "📋", cost: 300,  category: "Buildings", isBuilding: true  },
  trophy:   { name: "Trophy",       icon: "🏆", cost: 800,  category: "Decor",     isBuilding: true  },
  flag:     { name: "Goal Flag",    icon: "🚩", cost: 250,  category: "Decor",     isBuilding: true  },
  stars:    { name: "Star Lights",  icon: "⭐", cost: 400,  category: "Decor",     isBuilding: true  },
  fountain: { name: "Fountain",     icon: "⛲", cost: 1200, category: "Decor",     isBuilding: true  },
  garden:   { name: "Garden",       icon: "🌸", cost: 550,  category: "Decor",     isBuilding: true  },
  art:      { name: "Mural",        icon: "🎨", cost: 700,  category: "Decor",     isBuilding: true  },
  xp2:      { name: "XP Booster",  icon: "⚡", cost: 300,  category: "Upgrades",  isBuilding: false },
  gold2:    { name: "Gold Rush",    icon: "🪙", cost: 200,  category: "Upgrades",  isBuilding: false },
  timer:    { name: "Focus Power",  icon: "⏰", cost: 500,  category: "Upgrades",  isBuilding: false },
  streak:   { name: "Streak Shield",icon: "🛡️", cost: 750,  category: "Upgrades",  isBuilding: false },
  hint:     { name: "AI Hint",      icon: "🤖", cost: 100,  category: "Upgrades",  isBuilding: false },
  rest:     { name: "Rest Pass",    icon: "😴", cost: 400,  category: "Upgrades",  isBuilding: false },
};

export async function buyItem(itemId: string) {
  const userId = await requireAuth();

  const item = ITEM_CATALOG[itemId];
  if (!item) return { error: "Item not found" };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };
  if (user.gold < item.cost) return { error: "Not enough gold", gold: user.gold };

  // Deduct gold server-side
  await db.user.update({
    where: { id: userId },
    data: { gold: { decrement: item.cost } },
  });

  // Record purchase
  const purchase = await db.purchase.create({
    data: {
      userId,
      itemId,
      itemName: item.name,
      category: item.category,
      cost: item.cost,
    },
  });

  // If it's a building/decor, also create an unplaced building record
  if (item.isBuilding) {
    const city = await db.city.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    await db.placedBuilding.create({
      data: {
        cityId: city.id,
        itemId,
        name: item.name,
        icon: item.icon,
        category: item.category,
        x: -1,
        y: -1,
      },
    });
  }

  await checkAchievements(userId);
  revalidatePath("/rewards");
  revalidatePath("/community");

  return { success: true, purchaseId: purchase.id, newGold: user.gold - item.cost };
}

export async function getPurchases() {
  const userId = await requireAuth();
  const purchases = await db.purchase.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return purchases;
}

export async function getInventory() {
  const userId = await requireAuth();
  const city = await db.city.findUnique({ where: { userId } });
  if (!city) return [];

  // Unplaced buildings = x == -1
  const unplaced = await db.placedBuilding.findMany({
    where: { cityId: city.id, x: -1 },
    orderBy: { placedAt: "desc" },
  });
  return unplaced;
}
