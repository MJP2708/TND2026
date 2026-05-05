const SESSION_KEY = "tf:session";
const SESSION_COOKIE = "tf_session";

type Session = { id: string; email: string; name: string };

const DEMO: Session = { id: "demo", email: "demo@tycoon.app", name: "Demo User" };

export function login(email: string, password: string): boolean {
  if (
    email.toLowerCase().trim() === "demo@tycoon.app" &&
    password === "demo1234"
  ) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO));
    document.cookie = `${SESSION_COOKIE}=1; path=/; SameSite=Lax; max-age=86400`;
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
