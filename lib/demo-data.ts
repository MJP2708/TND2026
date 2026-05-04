import { generatePlan } from "./mock-ai-planner";
import type { AppState, OnboardingProfile } from "./types";

export const defaultProfile: OnboardingProfile = {
  mainGoal: "Prepare a calm, consistent exam/work sprint",
  deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28).toISOString().slice(0, 10),
  dailyHours: 3,
  energy: "balanced",
  difficulty: "standard",
  wellnessBaseline: ["Sleep has been uneven", "I want kinder planning"],
};

export function createInitialState(): AppState {
  const tasks = generatePlan(defaultProfile);
  tasks[0] = { ...tasks[0], status: "completed", completion: 100, focusMinutes: tasks[0].minutes };
  tasks[1] = { ...tasks[1], status: "partial", completion: 55, focusMinutes: Math.round(tasks[1].minutes * 0.55) };

  return {
    profile: defaultProfile,
    tasks,
    gold: 760,
    xp: 420,
    level: 3,
    focusMinutes: 185,
    streak: 4,
    rewards: [
      { id: "reward-netflix", title: "Watch Netflix 1 hour", cost: 500, note: "Evening recovery block" },
      { id: "reward-game", title: "Play game 30 minutes", cost: 300, note: "Use after today's focus" },
      { id: "reward-cafe", title: "Cafe drink budget", cost: 650, note: "Weekend treat" },
    ],
    vouchers: [],
    businesses: [
      { id: "coffee", name: "Coffee shop", description: "Converts morning focus into steady income", level: 2, baseCost: 420, icon: "Cup" },
      { id: "farm", name: "Focus farm", description: "Rewards consistency and partial wins", level: 1, baseCost: 360, icon: "Sprout" },
      { id: "tech", name: "Tech company", description: "High-cost upgrades for deep work streaks", level: 0, baseCost: 900, icon: "Cpu" },
      { id: "bookstore", name: "Bookstore", description: "Grows with review sessions and reflection", level: 1, baseCost: 520, icon: "BookOpen" },
    ],
    houseLevel: 2,
    moods: [
      { id: "mood-1", date: new Date(Date.now() - 86400000 * 2).toISOString(), tone: "tired", answers: ["Low energy", "Heavy workload"], goldAwarded: 25 },
      { id: "mood-2", date: new Date(Date.now() - 86400000).toISOString(), tone: "steady", answers: ["Okay focus", "Needed breaks"], goldAwarded: 25 },
    ],
    acceptedTodayAdjustment: false,
  };
}

