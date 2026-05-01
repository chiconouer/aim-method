const SESSION_KEY = "aim_session";
const PROGRESS_KEY = "aim_progress";

export interface User {
  email: string;
  name: string;
}

export function setSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = "aim_session=; path=/; max-age=0; secure; samesite=lax";
  document.cookie = "aim_user=; path=/; max-age=0; secure; samesite=lax";
}

export function getSession(): User | null {
  if (typeof window === "undefined") return null;

  // Check localStorage first
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try { return JSON.parse(raw) as User; } catch { localStorage.removeItem(SESSION_KEY); }
  }

  // Fall back to aim_user cookie set by the verify route (non-httpOnly, contains email+name)
  const match = document.cookie.split(";").find(c => c.trim().startsWith("aim_user="));
  if (match) {
    try {
      const b64 = match.trim().split("=").slice(1).join("=");
      const user = JSON.parse(atob(b64)) as User;
      // Sync to localStorage for subsequent reads
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return user;
    } catch {}
  }

  return null;
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function getProgress(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function markComplete(moduleId: number, lessonId: number): void {
  const progress = getProgress();
  progress[`${moduleId}-${lessonId}`] = true;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function isLessonComplete(moduleId: number, lessonId: number): boolean {
  const progress = getProgress();
  return progress[`${moduleId}-${lessonId}`] === true;
}

export function getModuleProgress(moduleId: number, totalLessons: number): number {
  const progress = getProgress();
  let completed = 0;
  for (let i = 1; i <= totalLessons; i++) {
    if (progress[`${moduleId}-${i}`]) completed++;
  }
  return Math.round((completed / totalLessons) * 100);
}
