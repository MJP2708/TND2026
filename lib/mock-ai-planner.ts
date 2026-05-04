import type { DifficultyPreference, EnergyPreference, OnboardingProfile, PlannedTask } from "./types";

const steps = [
  "Map scope and success criteria",
  "Study core concept",
  "Practice focused exercises",
  "Create summary notes",
  "Review weak spots",
  "Take a timed checkpoint",
  "Refine strategy and rest",
];

const categoryByIndex = ["Strategy", "Deep work", "Practice", "Review", "Checkpoint", "Recovery"];

function addDays(start: Date, days: number) {
  const next = new Date(start);
  next.setDate(next.getDate() + days);
  return next;
}

function difficultyOffset(value: DifficultyPreference) {
  return value === "gentle" ? -1 : value === "ambitious" ? 1 : 0;
}

function energyMinutes(value: EnergyPreference, hours: number) {
  const factor = value === "low" ? 0.72 : value === "high" ? 1.1 : 0.9;
  return Math.max(25, Math.round((hours * 60 * factor) / 2));
}

export function calculateReward(difficulty: number, minutes: number, completion: number) {
  const ratio = Math.max(0, Math.min(100, completion)) / 100;
  const gold = Math.round((difficulty * 24 + minutes * 0.9) * ratio);
  const xp = Math.round((difficulty * 18 + minutes * 0.7) * ratio);
  return { gold, xp };
}

export function generatePlan(profile: OnboardingProfile): PlannedTask[] {
  const today = new Date();
  const deadline = new Date(profile.deadline);
  const totalDays = Math.max(5, Math.ceil((deadline.getTime() - today.getTime()) / 86400000) + 1);
  const tasks: PlannedTask[] = [];
  const dailyMinutes = energyMinutes(profile.energy, profile.dailyHours);

  for (let dayIndex = 0; dayIndex < Math.min(totalDays, 21); dayIndex++) {
    const taskCount = profile.energy === "low" ? 2 : profile.energy === "high" ? 4 : 3;
    for (let slot = 0; slot < taskCount; slot++) {
      const sequence = (dayIndex * taskCount + slot) % steps.length;
      const difficulty = Math.max(
        1,
        Math.min(5, 2 + ((dayIndex + slot) % 3) + difficultyOffset(profile.difficulty)),
      );
      const minutes = Math.max(20, Math.round(dailyMinutes / taskCount / 5) * 5);
      const reward = calculateReward(difficulty, minutes, 100);

      tasks.push({
        id: `task-${dayIndex}-${slot}`,
        day: addDays(today, dayIndex).toISOString().slice(0, 10),
        title: `${steps[sequence]}: ${profile.mainGoal}`,
        category: categoryByIndex[sequence % categoryByIndex.length],
        minutes,
        difficulty,
        gold: reward.gold,
        xp: reward.xp,
        status: "pending",
        completion: 0,
        focusMinutes: 0,
        recoveryAfter: slot === taskCount - 1 ? 45 : 12 + difficulty * 3,
      });
    }
  }

  return tasks;
}

