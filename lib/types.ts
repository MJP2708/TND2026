export type EnergyLevel = "low" | "balanced" | "high";
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type TaskStatus = "pending" | "partial" | "completed";
export type MoodTone = "rested" | "steady" | "tired" | "overloaded";
export type GoalCategory = "study" | "career" | "creative" | "health" | "personal" | "other";
export type ThemeMode = "light" | "dark";
export type UiTone = "classic" | "sunrise" | "ocean" | "mono";
export type LanguageCode = "en" | "th" | "es";

export type Goal = {
  id: string;
  title: string;
  deadline: string; // YYYY-MM-DD
  dailyHours: number;
  energy: EnergyLevel;
  difficulty: DifficultyLevel;
  category: GoalCategory;
  createdAt: string;
};

export type Task = {
  id: string;
  day: string; // YYYY-MM-DD
  title: string;
  category: string;
  minutes: number;
  difficulty: DifficultyLevel;
  gold: number;
  xp: number;
  status: TaskStatus;
  completion: number; // 0–100
  focusMinutes: number;
  isRecovery?: boolean;
};

export type Business = {
  id: string;
  name: string;
  icon: string;
  description: string;
  benefit: string;
  level: number;
  baseCost: number;
};

export type Reward = {
  id: string;
  title: string;
  cost: number;
  note: string;
};

export type Voucher = {
  id: string;
  rewardTitle: string;
  code: string;
  used: boolean;
  createdAt: string;
};

export type MoodEntry = {
  id: string;
  date: string;
  tone: MoodTone;
  answers: string[];
  goldAwarded: number;
};

export type AppState = {
  userId: string;
  displayName: string;
  goal: Goal | null;
  tasks: Task[];
  gold: number;
  xp: number;
  level: number;
  streak: number;
  focusMinutes: number;
  houseLevel: number;
  businesses: Business[];
  rewards: Reward[];
  vouchers: Voucher[];
  moods: MoodEntry[];
  purchasedItems: string[];
  lastMoodDate: string;
  hasOnboarded: boolean;
  lastActiveDate: string;
  themeMode: ThemeMode;
  uiTone: UiTone;
  language: LanguageCode;
};
