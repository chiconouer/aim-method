const SESSION_KEY = "aim_session";
const PROGRESS_KEY = "aim_progress";

const USERS = [
  { email: "test@aimmethod.com", password: "test123", name: "Student" },
];

export interface User {
  email: string;
  name: string;
}

export function signIn(email: string, password: string): User | null {
  const user = USERS.find(
    (u) => u.email === email && u.password === password
  );
  if (!user) return null;
  const session: User = { email: user.email, name: user.name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
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
