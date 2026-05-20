import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local"), override: true });
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding achievement definitions…");

  const achievements = [
    { key: "first_focus",    name: "First Step",      description: "Complete your first focus session",  icon: "⭐", goldReward: 100, xpReward: 50  },
    { key: "streak_7",       name: "7 Day Streak",    description: "Maintain a 7-day focus streak",      icon: "🔥", goldReward: 250, xpReward: 150 },
    { key: "tasks_10",       name: "Task Master",     description: "Complete 10 tasks",                  icon: "✅", goldReward: 200, xpReward: 100 },
    { key: "first_building", name: "City Founder",    description: "Place your first building",          icon: "🏗", goldReward: 150, xpReward: 75  },
    { key: "first_purchase", name: "Shopkeeper",      description: "Make your first shop purchase",      icon: "🛍", goldReward: 100, xpReward: 50  },
    { key: "first_mood",     name: "Self-Aware",      description: "Complete your first mood check-in",  icon: "💚", goldReward: 75,  xpReward: 30  },
    { key: "first_post",     name: "Community Member",description: "Share your first post",              icon: "📣", goldReward: 100, xpReward: 50  },
    { key: "focus_master",   name: "Focus Master",    description: "Accumulate 10+ hours of focus",      icon: "🏆", goldReward: 500, xpReward: 300 },
    { key: "plan_complete",  name: "Plan Complete",   description: "Complete all tasks in a plan",       icon: "🌟", goldReward: 300, xpReward: 200 },
  ];

  for (const a of achievements) {
    await db.achievement.upsert({
      where: { key: a.key },
      update: { name: a.name, description: a.description, icon: a.icon, goldReward: a.goldReward, xpReward: a.xpReward },
      create: a,
    });
  }

  console.log(`Seeded ${achievements.length} achievements. Done.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
