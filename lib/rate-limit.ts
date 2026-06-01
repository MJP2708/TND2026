/**
 * Simple in-memory rate limiter for server actions.
 * In production, replace the Map with Upstash Redis for multi-instance support.
 */

type RateRecord = { count: number; resetAt: number };
const store = new Map<string, RateRecord>();

/**
 * Returns true if the action is allowed, false if the limit is exceeded.
 *
 * @param key       Unique key, e.g. `task_create:${userId}`
 * @param limit     Max allowed requests in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = store.get(key);

  if (!record || record.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) return false;

  record.count++;
  return true;
}

// Convenience wrappers with pre-set limits
export const rateLimit = {
  /** 30 task creates per minute per user */
  taskCreate:   (userId: string) => checkRateLimit(`task_create:${userId}`,   30, 60_000),
  /** 10 building purchases per minute per user */
  purchase:     (userId: string) => checkRateLimit(`purchase:${userId}`,      10, 60_000),
  /** 5 focus session saves per minute per user */
  focusSave:    (userId: string) => checkRateLimit(`focus_save:${userId}`,     5, 60_000),
  /** 20 generic mutations per minute per user */
  generic:      (userId: string) => checkRateLimit(`generic:${userId}`,       20, 60_000),
};
