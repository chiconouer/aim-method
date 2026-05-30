import type { CSSProperties } from "react";

export type LessonThumbnailState =
  | "locked"
  | "current"
  | "completed"
  | "available";

interface LessonThumbnailProps {
  state: LessonThumbnailState;
  /** Pass `number` for a lesson (gradient + number) OR `emoji` for a quiz tile. */
  number?: number;
  emoji?: string;
  /** Side length in pixels. Defaults to 60. */
  size?: number;
}

/**
 * Shared "Style A" thumbnail used in the course page and the lesson sidebar.
 * Gradient + number for lessons, translucent purple + emoji for quizzes.
 * Same 4 states across both variants, prioritized:
 *   locked > current > completed > available
 */
export function LessonThumbnail({
  state,
  number,
  emoji,
  size = 60,
}: LessonThumbnailProps) {
  const borderRadius = Math.max(6, Math.round(size * 0.17));

  if (state === "locked") {
    return (
      <div
        className="flex-shrink-0 flex items-center justify-center bg-[#2a2a2a]"
        style={{ width: size, height: size, borderRadius }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-500"
          style={{ width: size * 0.4, height: size * 0.4 }}
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
    );
  }

  const isQuiz = typeof emoji === "string";

  // Lessons get the saturated brand gradient; quizzes get a softer
  // translucent purple so they read as "different kind of node".
  const surfaceClass = isQuiz
    ? "relative flex-shrink-0 flex items-center justify-center bg-purple-500/15 border border-purple-500/40"
    : "relative flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700";

  const surfaceStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius,
    boxShadow:
      state === "current" ? "0 0 16px rgba(139, 92, 246, 0.6)" : undefined,
  };

  return (
    <div className={surfaceClass} style={surfaceStyle}>
      {isQuiz ? (
        <span
          className="leading-none"
          style={{ fontSize: Math.round(size * 0.42) }}
        >
          {emoji}
        </span>
      ) : (
        <span
          className="text-white font-medium leading-none"
          style={{ fontSize: Math.round(size * 0.45) }}
        >
          {number}
        </span>
      )}
      {state === "completed" && <CompletedBadge size={size} />}
    </div>
  );
}

function CompletedBadge({ size }: { size: number }) {
  const badgeSize = Math.max(14, Math.round(size * 0.37));
  const checkSize = Math.max(8, Math.round(size * 0.22));
  return (
    <span
      className="absolute flex items-center justify-center rounded-full bg-[#10b981]"
      style={{
        width: badgeSize,
        height: badgeSize,
        top: -Math.round(badgeSize * 0.2),
        right: -Math.round(badgeSize * 0.2),
        // The "cut" effect against the page bg
        boxShadow: "0 0 0 2px #0a0a0a",
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-white"
        style={{ width: checkSize, height: checkSize }}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}
