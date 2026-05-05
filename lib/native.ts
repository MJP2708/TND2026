// Placeholders for Capacitor native features.
// Install the matching @capacitor/* package and uncomment when ready.

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as Window & { Capacitor?: { isNativePlatform?(): boolean } })
      .Capacitor?.isNativePlatform?.()
  );
}

export function vibrate(ms = 10): void {
  // Future: import { Haptics, ImpactStyle } from "@capacitor/haptics";
  // Haptics.impact({ style: ImpactStyle.Light });
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

export async function scheduleReminder(
  title: string,
  body: string,
  delayMs: number
): Promise<void> {
  // Future: import { LocalNotifications } from "@capacitor/local-notifications";
  // LocalNotifications.schedule({ notifications: [{ title, body, id: Date.now(), schedule: { at: new Date(Date.now() + delayMs) } }] });
  console.info("[native] Reminder scheduled (stub):", { title, body, delayMs });
}

export async function saveOfflineState(key: string, value: unknown): Promise<void> {
  // Future: import { Preferences } from "@capacitor/preferences";
  // Preferences.set({ key, value: JSON.stringify(value) });
  try {
    localStorage.setItem(`offline:${key}`, JSON.stringify(value));
  } catch {
    // storage unavailable — ignore silently
  }
}
