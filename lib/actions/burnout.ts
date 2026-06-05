"use server";

import { requireAuth } from "./require-auth";
import { db } from "@/lib/db";

export type BurnoutLevel = "none" | "mild" | "moderate" | "high";

export type BurnoutResult = {
  level: BurnoutLevel;
  message: string;
  messageTh: string;
  action: "none" | "reduce_tasks" | "add_break" | "intervention";
};

function toneToScore(tone: string): number {
  if (tone === "rested")     return 4;
  if (tone === "steady")     return 3;
  if (tone === "tired")      return 2;
  if (tone === "overloaded") return 1;
  return 3;
}

export async function analyzeBurnoutRisk(): Promise<BurnoutResult> {
  const userId = await requireAuth();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [moods, completedThisWeek] = await Promise.all([
    db.moodCheckIn.findMany({
      where: { userId, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "asc" },
      select: { tone: true, createdAt: true },
    }),
    db.task.count({
      where: { userId, status: "completed", updatedAt: { gte: sevenDaysAgo } },
    }),
  ]);

  if (moods.length < 2) {
    return { level: "none", message: "", messageTh: "", action: "none" };
  }

  const scores = moods.map((m) => toneToScore(m.tone));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const recent = scores.slice(-3);
  const trend = recent[recent.length - 1] - recent[0];
  const lowDays = scores.filter((s) => s <= 2).length;

  let score = 0;
  if (avg <= 2.5) score += 3;
  else if (avg <= 3) score += 1;
  if (trend <= -1.5) score += 2;
  if (lowDays >= 3) score += 2;
  if (completedThisWeek < 3) score += 1;

  if (score >= 6) {
    return {
      level: "high",
      message: "You've been pushing really hard lately. Your mood has been low for several days. It's okay to slow down — rest is part of the process.",
      messageTh: "คุณทำงานหนักมากช่วงนี้ อารมณ์ต่ำหลายวันติดกัน ไม่เป็นไร — การพักคือส่วนหนึ่งของความสำเร็จ",
      action: "intervention",
    };
  }
  if (score >= 4) {
    return {
      level: "moderate",
      message: "Noticing signs of fatigue. Take it easy today — focus on what matters most and give yourself a break.",
      messageTh: "สังเกตว่าคุณอาจเหนื่อยนิดหน่อย ทำสิ่งสำคัญที่สุดวันนี้และพักผ่อนด้วยนะ",
      action: "reduce_tasks",
    };
  }
  if (score >= 2) {
    return {
      level: "mild",
      message: "You've been consistent — great work. Remember to build in breaks so you can keep this up long-term.",
      messageTh: "คุณทำได้สม่ำเสมอมาก เยี่ยมมาก อย่าลืมพักด้วยนะ จะได้ทำต่อได้นาน",
      action: "add_break",
    };
  }

  return { level: "none", message: "", messageTh: "", action: "none" };
}
