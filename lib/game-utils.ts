// Pure client/server-safe game utilities — no "use server"

export function getHappinessMultiplier(happiness: number): number {
  if (happiness >= 80) return 1.25;
  if (happiness >= 50) return 1.0;
  if (happiness >= 25) return 0.8;
  return 0.5;
}

export const STREAK_MILESTONES = [
  { days: 3,  reward: "+50 Gold",                     icon: "🪙" },
  { days: 7,  reward: "Scholar citizen unlocked",     icon: "🎓" },
  { days: 14, reward: "Architect citizen + gold skin", icon: "🏗" },
  { days: 21, reward: "+200 Energy + 200 Gold",        icon: "⚡" },
  { days: 30, reward: "Prestige Monument unlocked",    icon: "🏛" },
];
