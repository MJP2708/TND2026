import type { Goal, Task, DifficultyLevel } from "./types";

function addDays(base: Date, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function goldFor(diff: DifficultyLevel, mins: number) {
  return Math.round((diff * 18 + mins * 0.75) * 1.1);
}

function xpFor(diff: DifficultyLevel, mins: number) {
  return Math.round(diff * 28 + mins * 1.1);
}

const TEMPLATES: Record<GoalCategory, string[]> = {
  study: [
    "Review core concepts",
    "Practice problem set",
    "Read chapter notes",
    "Summarise key ideas",
    "Mock test section",
    "Flashcard review",
    "Watch lecture segment",
    "Write summary notes",
    "Solve exercises",
    "Group and connect topics",
  ],
  career: [
    "Work on a key skill",
    "Review your portfolio",
    "Practice interview question",
    "Update CV section",
    "Research the industry",
    "Build a small feature",
    "Write documentation",
    "Reach out to a contact",
    "Complete course module",
    "Plan the next milestone",
  ],
  creative: [
    "Brainstorm ideas",
    "Rough draft session",
    "Revise earlier work",
    "Research references",
    "Sketch concepts",
    "Practice a technique",
    "Critique your own work",
    "Experiment freely",
    "Finish one piece",
    "Share for feedback",
  ],
  health: [
    "Light workout session",
    "Meal prep — 30 min",
    "Stretching & breathwork",
    "Read a health article",
    "Plan meals for the week",
    "Track your progress",
    "Rest and recover",
    "Morning walk",
    "Evening reflection",
    "Build sleep routine",
  ],
  personal: [
    "Reflect on progress",
    "Read one chapter",
    "Journaling session",
    "Call someone you care about",
    "Organise one area",
    "Learn something new",
    "Creative hobby time",
    "Plan next week",
    "Gratitude notes",
    "Digital detox hour",
  ],
  other: [
    "Work on main task",
    "Review recent progress",
    "Plan next steps",
    "Do one focused block",
    "Check in with yourself",
    "Wrap up loose ends",
    "Prepare for tomorrow",
    "Reflect on the week",
  ],
};

type GoalCategory = Goal["category"];

export function generatePlan(goal: Goal): Task[] {
  const today = new Date();
  const deadline = new Date(goal.deadline);
  const totalDays = Math.max(1, Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000));
  const planDays = Math.min(totalDays, 21);
  const tasksPerDay = goal.energy === "high" ? 3 : goal.energy === "low" ? 1 : 2;
  const baseMins = goal.energy === "high" ? 50 : goal.energy === "low" ? 25 : 35;
  const templates = TEMPLATES[goal.category] ?? TEMPLATES.other;
  const tasks: Task[] = [];

  for (let d = 0; d < planDays; d++) {
    const day = addDays(today, d);
    const dow = new Date(day).getDay();
    const isWeekend = dow === 0 || dow === 6;
    const count = isWeekend && goal.energy === "low" ? 1 : tasksPerDay;

    for (let t = 0; t < count; t++) {
      const idx = (d * tasksPerDay + t) % templates.length;
      const diff = Math.max(1, Math.min(5, goal.difficulty + (t > 1 ? -1 : 0))) as DifficultyLevel;
      const mins = Math.max(20, Math.min(90, baseMins + (t === 0 ? 0 : -10) + (d % 3 === 0 ? 10 : 0)));
      tasks.push({
        id: `t-${d}-${t}-${Math.random().toString(36).slice(2, 7)}`,
        day,
        title: templates[idx],
        category: goal.category,
        minutes: mins,
        difficulty: diff,
        gold: goldFor(diff, mins),
        xp: xpFor(diff, mins),
        status: "pending",
        completion: 0,
        focusMinutes: 0,
      });
    }

    // Recovery gap every 3 days
    if ((d + 1) % 3 === 0) {
      tasks.push({
        id: `rec-${d}-${Math.random().toString(36).slice(2, 7)}`,
        day,
        title: "Recovery gap",
        category: "recovery",
        minutes: 15,
        difficulty: 1,
        gold: 10,
        xp: 15,
        status: "pending",
        completion: 0,
        focusMinutes: 0,
        isRecovery: true,
      });
    }
  }

  return tasks;
}

export function calcReward(
  diff: DifficultyLevel,
  mins: number,
  completion: number,
): { gold: number; xp: number } {
  const r = completion / 100;
  return {
    gold: Math.round(goldFor(diff, mins) * r),
    xp: Math.round(xpFor(diff, mins) * r),
  };
}
