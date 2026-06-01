/**
 * Calculate the new streak value given the user's last active date.
 *
 * Rules:
 * - Same calendar day as last activity → streak unchanged (only one tick per day)
 * - Within 36 hours of last activity → streak increments (catches 11:58 PM → 12:05 AM edge case)
 * - More than 36 hours → streak resets to 1
 */
export function calcNewStreak(lastActiveDate: string | null | undefined, currentStreak: number): number {
  if (!lastActiveDate) return 1;

  const today = new Date().toISOString().slice(0, 10);
  if (lastActiveDate === today) return currentStreak; // already active today

  const lastMs   = new Date(lastActiveDate).getTime();
  const nowMs    = Date.now();
  const gapHours = (nowMs - lastMs) / (1000 * 60 * 60);

  // 36-hour window handles late-night → early-morning case
  if (gapHours <= 36) return currentStreak + 1;
  return 1;
}
