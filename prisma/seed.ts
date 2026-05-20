import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local"), override: true });
config({ path: resolve(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database…");

  // Demo user
  const hash = await bcrypt.hash("demo1234", 12);
  const demo = await db.user.upsert({
    where: { email: "demo@focusville.app" },
    update: {},
    create: {
      email: "demo@focusville.app",
      name: "Demo User",
      displayName: "Demo",
      password: hash,
      gold: 500,
      xp: 0,
      streak: 0,
      level: 1,
    },
  });
  console.log(`Demo user: ${demo.email}`);

  // Achievement definitions — match Achievement model: key, name, description, icon, goldReward, xpReward
  const achievements = [
    { key: "first_focus", name: "First Focus",   description: "Complete your first focus session",  icon: "🎯", goldReward: 50,  xpReward: 25  },
    { key: "streak_3",    name: "On a Roll",      description: "3-day streak",                       icon: "🔥", goldReward: 75,  xpReward: 50  },
    { key: "streak_7",    name: "Week Warrior",   description: "7-day streak",                       icon: "⚡", goldReward: 150, xpReward: 100 },
    { key: "streak_30",   name: "Iron Focus",     description: "30-day streak",                      icon: "💪", goldReward: 500, xpReward: 300 },
    { key: "tasks_10",    name: "Task Crusher",   description: "Complete 10 tasks",                  icon: "✅", goldReward: 100, xpReward: 75  },
    { key: "tasks_50",    name: "Taskmaster",     description: "Complete 50 tasks",                  icon: "🏆", goldReward: 300, xpReward: 200 },
    { key: "focus_60",    name: "Hour of Power",  description: "60 minutes of focus in one day",    icon: "⏱️", goldReward: 100, xpReward: 75  },
    { key: "focus_500",   name: "Deep Worker",    description: "500 total focus minutes",            icon: "🧠", goldReward: 250, xpReward: 150 },
    { key: "rich",        name: "Gold Hoarder",   description: "Accumulate 1000 gold",               icon: "🪙", goldReward: 0,   xpReward: 50  },
  ];

  for (const a of achievements) {
    await db.achievement.upsert({
      where: { key: a.key },
      update: { name: a.name, description: a.description, icon: a.icon, goldReward: a.goldReward, xpReward: a.xpReward },
      create: a,
    });
  }
  console.log(`Seeded ${achievements.length} achievements`);

  console.log("Done.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
