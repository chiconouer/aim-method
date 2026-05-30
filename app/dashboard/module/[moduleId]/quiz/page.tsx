"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getSession, User } from "@/lib/auth";
import { MODULES, getModule } from "@/lib/courseData";
import { QUIZZES } from "@/lib/quizData";
import { isModuleUnlocked } from "@/lib/moduleAccess";

type Phase = "loading" | "quiz" | "submitting" | "results" | "submit-error";

const TOTAL_MODULES = MODULES.length;

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = Number(params.moduleId);

  const [user, setUser] = useState<User | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [sparkleKey, setSparkleKey] = useState(0);

  const mod = getModule(moduleId);
  const quiz = useMemo(
    () => QUIZZES.find((q) => q.moduleId === moduleId),
    [moduleId],
  );

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/auth/sign-in");
      return;
    }
    setUser(session);

    // Verify the module is unlocked before letting the student take the quiz
    fetch(`/api/quiz/status?email=${encodeURIComponent(session.email)}`)
      .then((r) => r.json())
      .then((data) => {
        const completed: number[] = Array.isArray(data?.completedModules)
          ? data.completedModules
          : [];
        if (!isModuleUnlocked(moduleId, completed)) {
          router.replace(`/dashboard/module/${moduleId}`);
          return;
        }
        setPhase("quiz");
      })
      .catch(() => {
        // Fail closed — back to module page (which itself enforces the lock)
        router.replace(`/dashboard/module/${moduleId}`);
      });
  }, [router, moduleId]);

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading quiz…</div>
      </div>
    );
  }

  if (!mod || !quiz || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-white text-lg mb-3">Quiz not available.</p>
          <Link href="/dashboard" className="text-purple-400 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const questions = quiz.questions;
  const total = questions.length;
  const currentQuestion = questions[currentIdx];
  const isLast = currentIdx === total - 1;
  const isAnswered = selectedIndex !== null;
  const isCorrect = isAnswered && selectedIndex === currentQuestion.correctIndex;

  function handleSelect(optIdx: number) {
    if (selectedIndex !== null) return;
    setSelectedIndex(optIdx);
    const nextAnswers = [...answers];
    nextAnswers[currentIdx] = optIdx;
    setAnswers(nextAnswers);
    if (optIdx === currentQuestion.correctIndex) {
      setSparkleKey((k) => k + 1);
    }
  }

  async function handleFinish(finalAnswers: number[]) {
    if (!user) return;
    const score = finalAnswers.reduce(
      (acc, ans, i) => (ans === questions[i].correctIndex ? acc + 1 : acc),
      0,
    );
    setPhase("submitting");
    setSubmitError(null);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          moduleId,
          score,
          total,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Submission failed");
      }
      setPassed(Boolean(data.passed));
      setPhase("results");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
      setPhase("submit-error");
    }
  }

  function handleNext() {
    if (!isAnswered) return;
    if (isLast) {
      handleFinish(answers);
      return;
    }
    setCurrentIdx((i) => i + 1);
    setSelectedIndex(null);
  }

  // RESULTS
  if (phase === "results") {
    const score = answers.reduce(
      (acc, ans, i) => (ans === questions[i].correctIndex ? acc + 1 : acc),
      0,
    );
    const pct = Math.round((score / total) * 100);
    const isLastModule = moduleId >= TOTAL_MODULES;

    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5 py-10">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center quiz-fade-up relative overflow-hidden">
          {passed && <SparkleBurst count={14} />}

          <div className="text-5xl mb-3">
            {passed ? <span className="trophy-bounce">🏆</span> : "📘"}
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-1">
            {passed ? "Great job!" : "Quiz completed"}
          </h1>
          <p className="text-purple-400 text-sm font-semibold mb-5">
            You got {score} out of {total} ({pct}%)
          </p>

          {passed ? (
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              🎉 You really understood this module. Keep that momentum going!
            </p>
          ) : (
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Your score was a bit low. I&apos;d recommend reviewing this module
              before moving on — but the next module is now unlocked if you
              want to continue.
            </p>
          )}

          {isLastModule ? (
            <div className="bg-purple-500/10 border border-purple-500/25 rounded-xl p-4 mb-4">
              <p className="text-purple-300 font-bold text-sm">
                You&apos;ve completed all modules! 🏆
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Time to put it into action.
              </p>
            </div>
          ) : (
            <Link
              href={`/dashboard/module/${moduleId + 1}`}
              className="purple-btn text-white font-bold py-3 px-6 rounded-xl text-sm inline-block w-full mb-3"
            >
              Continue to Module {moduleId + 1} →
            </Link>
          )}

          <Link
            href="/dashboard"
            className="outline-btn font-semibold py-3 px-6 rounded-xl text-sm inline-block w-full"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // SUBMIT ERROR
  if (phase === "submit-error") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h1 className="text-xl font-extrabold text-white mb-2">
            Couldn&apos;t save your quiz
          </h1>
          <p className="text-gray-400 text-sm mb-5">
            {submitError ?? "Something went wrong."} Please try again.
          </p>
          <button
            onClick={() => handleFinish(answers)}
            className="purple-btn text-white font-bold py-3 px-6 rounded-xl text-sm w-full mb-2"
          >
            Try Again
          </button>
          <Link
            href={`/dashboard/module/${moduleId}`}
            className="block text-gray-500 hover:text-purple-400 text-sm transition-colors mt-3"
          >
            ← Back to Module
          </Link>
        </div>
      </div>
    );
  }

  // SUBMITTING
  if (phase === "submitting") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Saving your results…</div>
      </div>
    );
  }

  // QUIZ
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-2xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 rounded-full px-3 py-1 text-xs text-purple-300 mb-3">
            Module {mod.id} · Quiz
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            {mod.title}
          </h1>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs">
              Question {currentIdx + 1} of {total}
            </span>
            <span className="text-purple-400 text-xs font-semibold">
              {Math.round(((currentIdx + (isAnswered ? 1 : 0)) / total) * 100)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
              style={{
                width: `${((currentIdx + (isAnswered ? 1 : 0)) / total) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          key={currentIdx}
          className={`glass-card rounded-2xl p-6 mb-5 quiz-fade-up ${
            isAnswered && !isCorrect ? "quiz-shake" : ""
          }`}
        >
          <p className="text-white font-bold text-base sm:text-lg leading-snug mb-5">
            {currentQuestion.question}
          </p>

          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((opt, optIdx) => {
              const letters = ["A", "B", "C", "D"];
              const isThisSelected = selectedIndex === optIdx;
              const isThisCorrect = optIdx === currentQuestion.correctIndex;
              const revealCorrect =
                isAnswered && !isCorrect && isThisCorrect;

              let cls =
                "relative w-full text-left rounded-xl border p-4 flex items-start gap-3 transition-all text-sm ";

              if (!isAnswered) {
                cls +=
                  "bg-white/3 border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 cursor-pointer text-gray-200";
              } else if (isThisSelected && isThisCorrect) {
                cls +=
                  "bg-green-500/15 border-green-500/50 text-green-300 quiz-correct-pulse";
              } else if (isThisSelected && !isThisCorrect) {
                cls += "bg-red-500/15 border-red-500/50 text-red-300";
              } else if (revealCorrect) {
                cls += "bg-green-500/10 border-green-500/40 text-green-300";
              } else {
                cls += "bg-white/2 border-white/5 text-gray-500 opacity-70";
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelect(optIdx)}
                  disabled={isAnswered}
                  className={cls}
                >
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isThisSelected && isThisCorrect
                        ? "bg-green-500/30 text-green-200"
                        : isThisSelected && !isThisCorrect
                          ? "bg-red-500/30 text-red-200"
                          : revealCorrect
                            ? "bg-green-500/20 text-green-300"
                            : "bg-white/5 text-gray-400"
                    }`}
                  >
                    {letters[optIdx]}
                  </span>
                  <span className="flex-1 pt-0.5">{opt}</span>
                  {isThisSelected && isThisCorrect && (
                    <span className="quiz-pop-in text-green-300 text-lg leading-none">
                      ✓
                    </span>
                  )}
                  {isThisSelected && !isThisCorrect && (
                    <span className="quiz-pop-in text-red-300 text-lg leading-none">
                      ✕
                    </span>
                  )}
                  {revealCorrect && (
                    <span className="text-green-300 text-lg leading-none">
                      ✓
                    </span>
                  )}
                  {isThisSelected && isThisCorrect && (
                    <SparkleBurst key={sparkleKey} count={8} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Next / Finish */}
        <div className="flex gap-3">
          <Link
            href={`/dashboard/module/${moduleId}`}
            className="outline-btn font-semibold py-3 px-5 rounded-xl text-sm flex-shrink-0"
          >
            Exit
          </Link>
          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className={`flex-1 font-bold py-3 px-6 rounded-xl text-sm transition-all ${
              isAnswered
                ? "purple-btn text-white"
                : "bg-white/5 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isLast ? "Finish Quiz" : "Next →"}
          </button>
        </div>
      </main>
    </div>
  );
}

function SparkleBurst({ count }: { count: number }) {
  // Pre-computed sparkle directions so the burst spreads radially
  const sparkles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const distance = 50 + Math.random() * 30;
    return {
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      delay: Math.random() * 0.15,
      char: ["✦", "✧", "★", "✨"][i % 4],
    };
  });
  return (
    <span className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="quiz-sparkle absolute text-purple-300 text-sm"
          style={
            {
              ["--dx" as string]: `${s.dx}px`,
              ["--dy" as string]: `${s.dy}px`,
              animationDelay: `${s.delay}s`,
            } as React.CSSProperties
          }
        >
          {s.char}
        </span>
      ))}
    </span>
  );
}
