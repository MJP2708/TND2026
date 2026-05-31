export type EnergyLevel = "low" | "balanced" | "high";
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type TaskStatus = "pending" | "partial" | "completed";
export type MoodTone = "rested" | "steady" | "tired" | "overloaded";
export type GoalCategory = "study" | "career" | "creative" | "health" | "personal" | "other";
export type ThemeMode = "light" | "dark";
export type UiTone = "classic" | "sunrise" | "ocean" | "mono";
export type LanguageCode = "en" | "th" | "es";

// ── Game systems ──────────────────────────────────────────────────────────────

export type EraType = "pioneer" | "modern" | "metropolis";
export type DistrictType = "residential" | "industrial" | "green" | "knowledge";
export type BuildingHealth = "healthy" | "due_soon" | "deteriorating" | "collapsed";
export type SpecialCitizenType = "scholar" | "merchant" | "architect" | "healer";

export type SpecialCitizen = {
  id: string;
  type: SpecialCitizenType;
  name: string;
  bonus: string;
  assignedTo: string | null;
  expiresAt: string | null;
};

export type EventEffect = {
  happiness?: number;
  gold?: number;
  energy?: number;
  constructionDiscount?: boolean;
  specialCitizen?: SpecialCitizenType;
  challengeKey?: string;
};

export type EventChoice = {
  label: string;
  description: string;
  effect: EventEffect;
};

export type DailyEvent = {
  type: string;
  title: string;
  description: string;
  icon: string;
  choices: EventChoice[];
};

export type EventRecord = {
  date: string;
  type: string;
  choiceIndex: number;
  outcome: EventEffect;
};

export type PassiveIncome = {
  gold: number;
  energy: number;
  hours: number;
};

export type StreakMilestone = {
  days: number;
  reward: string;
  icon: string;
  reached: boolean;
};

// ── Core domain types ─────────────────────────────────────────────────────────

export type Goal = {
  id: string;
  title: string;
  deadline: string;
  dailyHours: number;
  energy: EnergyLevel;
  difficulty: DifficultyLevel;
  category: GoalCategory;
  createdAt: string;
  status?: "active" | "paused" | "archived" | "completed" | "failed";
};

export type Task = {
  id: string;
  day: string;
  title: string;
  category: string;
  minutes: number;
  difficulty: DifficultyLevel;
  gold: number;
  xp: number;
  status: TaskStatus;
  completion: number;
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
  // Dual currency
  gold: number;
  energy: number;
  // Progression
  xp: number;
  level: number;
  streak: number;
  focusMinutes: number;
  houseLevel: number;
  // Game systems
  happiness: number;
  currentEra: EraType;
  prestigeCount: number;
  prestigeMultiplier: number;
  lastLoginAt: string;
  specialCitizens: SpecialCitizen[];
  todayEvent: DailyEvent | null;
  todayEventDate: string;
  totalBuilt: number;
  pendingPassiveIncome: PassiveIncome | null;
  // Active bonuses
  constructionDiscount: boolean;
  // Legacy / UI
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
