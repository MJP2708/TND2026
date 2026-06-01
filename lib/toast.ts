import { toast } from "sonner";

export const fvToast = {
  success: (msg: string) => toast.success(msg, { duration: 3000 }),
  error: (msg: string)   => toast.error(msg, { duration: 4000 }),
  info: (msg: string)    => toast(msg, { duration: 3000 }),
  achievement: (name: string, reward: string) =>
    toast(`🏆 Achievement unlocked: ${name}`, {
      description: reward,
      duration: 5000,
      icon: "🏆",
    }),
  reward: (label: string, gold?: number, xp?: number) => {
    const parts: string[] = [];
    if (gold) parts.push(`+${gold} 🪙`);
    if (xp)   parts.push(`+${xp} 💎`);
    toast.success(label, {
      description: parts.length > 0 ? parts.join("  ") : undefined,
      duration: 3500,
    });
  },
  purchase: (name: string) =>
    toast.success(`${name} added to your city!`, {
      icon: "🏗",
      duration: 3000,
    }),
};
