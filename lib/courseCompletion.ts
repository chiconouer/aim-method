import { MODULES } from "@/lib/courseData";

export const TOTAL_LESSONS = MODULES.reduce(
  (acc, m) => acc + m.lessons.length,
  0,
);
export const TOTAL_QUIZZES = MODULES.length;
const TOTAL_ITEMS = TOTAL_LESSONS + TOTAL_QUIZZES;

export interface CompletionStatus {
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  completedQuizzes: number;
  /** Lessons + quizzes counted equally toward a single percentage. */
  overallPct: number;
  /** True only when ALL lessons AND ALL quizzes are done. */
  isComplete: boolean;
}

export function getCompletionStatus(
  progressMap: Record<string, boolean>,
  completedModules: number[],
): CompletionStatus {
  const completedLessons = MODULES.reduce(
    (acc, m) =>
      acc + m.lessons.filter((l) => progressMap[`${m.id}-${l.id}`]).length,
    0,
  );
  const completedQuizzes = MODULES.filter((m) =>
    completedModules.includes(m.id),
  ).length;
  const isComplete =
    completedLessons === TOTAL_LESSONS && completedQuizzes === TOTAL_QUIZZES;
  const overallPct = Math.round(
    ((completedLessons + completedQuizzes) / TOTAL_ITEMS) * 100,
  );
  return {
    totalLessons: TOTAL_LESSONS,
    completedLessons,
    totalQuizzes: TOTAL_QUIZZES,
    completedQuizzes,
    overallPct,
    isComplete,
  };
}
