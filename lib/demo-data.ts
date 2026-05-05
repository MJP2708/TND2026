import type { AppState, Business, Goal } from "./types";
import { generatePlan } from "./ai-planner";

const deadline = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 28);
  return d.toISOString().slice(0, 10);
})();

export const DEMO_GOAL: Goal = {
  id: "goal-demo",
  title: "Prepare for final exam",
  deadline,
  dailyHours: 3,
  energy: "balanced",
  difficulty: 3,
  category: "study",
  createdAt: new Date().toISOString(),
};

const BUSINESSES: Business[] = [
  {
    id: "b-coffee",
    name: "Coffee Shop",
    icon: "☕",
    description: "A cozy corner cafe that rewards deep work.",
    benefit: "+5 Gold per focus session",
    level: 1,
    baseCost: 200,
  },
  {
    id: "b-farm",
    name: "Farm",
    icon: "🌾",
    description: "A small productive farm that grows with consistency.",
    benefit: "+8 XP each day you study",
    level: 0,
    baseCost: 150,
  },
  {
    id: "b-tech",
    name: "Tech Studio",
    icon: "💻",
    description: "A focused studio for deep technical work.",
    benefit: "+10 Gold per completed task",
    level: 0,
    baseCost: 350,
  },
  {
    id: "b-books",
    name: "Bookstore",
    icon: "📚",
    description: "A knowledge hub that compounds your learning.",
    benefit: "−5% estimated task time",
    level: 0,
    baseCost: 250,
  },
];

export function createDemoState(): AppState {
  const tasks = generatePlan(DEMO_GOAL);

  if (tasks[0]) {
    tasks[0].status = "completed";
    tasks[0].completion = 100;
    tasks[0].focusMinutes = tasks[0].minutes;
  }
  if (tasks[1]) {
    tasks[1].status = "partial";
    tasks[1].completion = 50;
    tasks[1].focusMinutes = Math.round(tasks[1].minutes / 2);
  }

  return {
    userId: "demo",
    displayName: "Student",
    goal: DEMO_GOAL,
    tasks,
    gold: 760,
    xp: 1240,
    level: 4,
    streak: 5,
    focusMinutes: 185,
    houseLevel: 2,
    businesses: BUSINESSES,
    rewards: [
      { id: "r1", title: "Watch one episode", cost: 250, note: "A well-earned break." },
      { id: "r2", title: "Order favourite food", cost: 500, note: "You deserve it." },
      { id: "r3", title: "Free afternoon off", cost: 800, note: "No guilt, full rest." },
    ],
    vouchers: [],
    moods: [
      {
        id: "m1",
        date: new Date(Date.now() - 86_400_000).toISOString(),
        tone: "steady",
        answers: ["Okay", "Manageable", "Start small"],
        goldAwarded: 25,
      },
    ],
    hasOnboarded: true,
    lastActiveDate: new Date().toISOString().slice(0, 10),
  };
}
