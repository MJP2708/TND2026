export type EnergyPreference = "low" | "balanced" | "high";
export type DifficultyPreference = "gentle" | "standard" | "ambitious";
export type TaskStatus = "pending" | "partial" | "completed";
export type MoodTone = "rested" | "steady" | "tired" | "overloaded";

export type OnboardingProfile = {
  mainGoal: string;
  deadline: string;
  dailyHours: number;
  energy: EnergyPreference;
  difficulty: DifficultyPreference;
  wellnessBaseline: string[];
};

export type PlannedTask = {
  id: string;
  day: string;
  title: string;
  category: string;
  minutes: number;
  difficulty: number;
  gold: number;
  xp: number;
  status: TaskStatus;
  completion: number;
  focusMinutes: number;
  recoveryAfter: number;
};

export type RewardItem = {
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

export type Business = {
  id: string;
  name: string;
  description: string;
  level: number;
  baseCost: number;
  icon: string;
};

export type MoodEntry = {
  id: string;
  date: string;
  tone: MoodTone;
  answers: string[];
  goldAwarded: number;
};

export type AppState = {
  profile: OnboardingProfile;
  tasks: PlannedTask[];
  gold: number;
  xp: number;
  level: number;
  focusMinutes: number;
  streak: number;
  rewards: RewardItem[];
  vouchers: Voucher[];
  businesses: Business[];
  houseLevel: number;
  moods: MoodEntry[];
  acceptedTodayAdjustment: boolean;
};

