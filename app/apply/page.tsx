"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { getSession, User } from "@/lib/auth";

type QuestionType = "yesno" | "single" | "text" | "textarea" | "email" | "phone";

interface Question {
  id: number;
  title: string;
  type: QuestionType;
  options?: string[];
  subtitle?: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: "Are you looking to build a profitable AI Model in the next 90 days?",
    type: "yesno",
  },
  {
    id: 2,
    title: "Where Are You Currently At with Your AI Model?",
    type: "single",
    options: [
      "I've started building it and want help",
      "I understand the idea but haven't started",
      "I'm still not sure what it takes",
    ],
  },
  {
    id: 3,
    title: "What's your Current Job?",
    type: "text",
  },
  {
    id: 4,
    title:
      "How Much Would It Take To Replace Your Current Monthly Income with AI Models?",
    type: "single",
    options: [
      "Less than $1,000",
      "$1,000-$2,500",
      "$2,501-$5,000",
      "$5,001-$10,000",
      "More than $10,000",
    ],
  },
  {
    id: 5,
    title:
      "If We Could Show You a Clear Path to Hitting Your Income Goals, Would You Be in a Position to Invest Time and Finances to Get Started Quicker?",
    type: "single",
    options: [
      "Yes, I'm ready to invest time and finances",
      "Yes, I have time but would need help with finances",
      "No, I'm just curious",
    ],
  },
  {
    id: 6,
    title:
      "What's Happening In Your Life Right Now that Has You Looking to Add Another Stream Of Income? And ultimately, What's Your Goal?",
    type: "textarea",
  },
  {
    id: 7,
    title: "Name and Last Name",
    type: "text",
  },
  {
    id: 8,
    title: "Are you 18 or older? You need to be.",
    type: "yesno",
  },
  {
    id: 9,
    title: "Email",
    type: "email",
  },
  {
    id: 10,
    title: "Phone Number",
    type: "phone",
    subtitle: "If outside US/Canada provide WhatsApp with country code",
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "welcome" | number | "submitting" | "done" | "error";

export default function ApplyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<Step>("welcome");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [limited, setLimited] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/auth/sign-in");
      return;
    }
    setUser(session);
    // Pre-fill email + name from session (still editable)
    setAnswers((prev) => ({
      ...prev,
      9: prev[9] ?? session.email,
      7: prev[7] ?? (session.name && session.name !== "Student" ? session.name : ""),
    }));
  }, [router]);

  function setAnswer(id: number, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function isAnswerValid(q: Question): boolean {
    const v = answers[q.id];
    if (!v) return false;
    switch (q.type) {
      case "yesno":
        return v === "Yes" || v === "No";
      case "single":
        return q.options?.includes(v) ?? false;
      case "text":
      case "textarea":
        return v.trim().length > 0;
      case "email":
        return EMAIL_REGEX.test(v.trim());
      case "phone":
        try {
          return isValidPhoneNumber(v);
        } catch {
          return false;
        }
    }
  }

  function goNext() {
    if (typeof step !== "number") return;
    const q = QUESTIONS[step];
    if (!isAnswerValid(q)) return;
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      submit();
    }
  }

  function goBack() {
    if (typeof step !== "number") return;
    if (step === 0) {
      setStep("welcome");
    } else {
      setStep(step - 1);
    }
  }

  async function submit() {
    if (!user) return;
    setStep("submitting");
    setSubmitError(null);
    setLimited(false);

    // Build answers payload with question titles as keys (Typeform-compatible shape)
    const answersByTitle: Record<string, string> = {};
    for (const q of QUESTIONS) {
      answersByTitle[q.title] = answers[q.id] ?? "";
    }

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: answers[7] ?? "",
          email: (answers[9] ?? user.email).toLowerCase().trim(),
          answers: answersByTitle,
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setLimited(true);
        setSubmitError(
          data?.error ??
            "You've submitted several applications today. Please wait until tomorrow.",
        );
        setStep("error");
        return;
      }
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Submission failed");
      }
      setStep("done");
    } catch (err) {
      console.error("[apply] submit failed:", err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Couldn't submit your application. Please try again.",
      );
      setStep("error");
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top bar — progress */}
      <ProgressBar step={step} total={QUESTIONS.length} />

      <main className="flex-1 flex items-start sm:items-center justify-center px-5 py-10">
        <div className="w-full max-w-xl">
          {step === "welcome" && (
            <WelcomeScreen onStart={() => setStep(0)} />
          )}

          {typeof step === "number" && (
            <QuestionScreen
              key={step}
              question={QUESTIONS[step]}
              value={answers[QUESTIONS[step].id] ?? ""}
              onChange={(v) => setAnswer(QUESTIONS[step].id, v)}
              onNext={goNext}
              onBack={goBack}
              isValid={isAnswerValid(QUESTIONS[step])}
              isLast={step === QUESTIONS.length - 1}
              questionNumber={step + 1}
              total={QUESTIONS.length}
            />
          )}

          {step === "submitting" && (
            <div className="text-center quiz-fade-up">
              <div className="text-gray-400 text-sm">Submitting your application…</div>
            </div>
          )}

          {step === "done" && <DoneScreen />}

          {step === "error" && (
            <ErrorScreen
              message={submitError ?? "Something went wrong."}
              limited={limited}
              onRetry={() => {
                setStep(QUESTIONS.length - 1);
                setSubmitError(null);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function ProgressBar({ step, total }: { step: Step; total: number }) {
  let pct = 0;
  let label = "";
  if (step === "welcome") {
    pct = 0;
    label = "";
  } else if (typeof step === "number") {
    pct = ((step + 1) / total) * 100;
    label = `Question ${step + 1} of ${total}`;
  } else if (step === "done" || step === "submitting") {
    pct = 100;
    label = "";
  }

  return (
    <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-gray-500 hover:text-purple-400 text-xs sm:text-sm transition-colors flex items-center gap-1"
        >
          ← Exit
        </Link>
        <div className="flex-1 max-w-md">
          {label && (
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-[10px] sm:text-xs">{label}</span>
              <span className="text-purple-400 text-[10px] sm:text-xs font-semibold">
                {Math.round(pct)}%
              </span>
            </div>
          )}
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="w-12 sm:w-16" />
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="quiz-fade-up text-center sm:text-left">
      <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 rounded-full px-3 py-1 text-xs text-purple-300 mb-5">
        🎯 1-on-1 Coaching Application
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">
        Apply for 1-on-1 Coaching
      </h1>
      <div className="glass-card rounded-2xl p-5 mb-8 text-left">
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
          ⚠️ This application is for serious students only. We only accept a
          limited number of 1-on-1 clients per month. Complete the form below to
          see if you qualify.
        </p>
      </div>
      <button
        onClick={onStart}
        className="purple-btn text-white font-bold py-3.5 px-10 rounded-xl text-base"
      >
        Start →
      </button>
      <p className="text-gray-600 text-xs mt-4">Takes about 2 minutes</p>
    </div>
  );
}

function QuestionScreen({
  question,
  value,
  onChange,
  onNext,
  onBack,
  isValid,
  isLast,
  questionNumber,
  total,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
  isLast: boolean;
  questionNumber: number;
  total: number;
}) {
  return (
    <div className="quiz-fade-up">
      <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-3">
        Question {questionNumber} of {total}
      </p>
      <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2 leading-snug">
        {question.title}
      </h2>
      {question.subtitle && (
        <p className="text-gray-400 text-sm mb-5">{question.subtitle}</p>
      )}
      {!question.subtitle && <div className="mb-5" />}

      <QuestionInput
        question={question}
        value={value}
        onChange={onChange}
        onEnterSubmit={isValid ? onNext : undefined}
      />

      <div className="flex items-center gap-3 mt-8">
        <button
          onClick={onBack}
          type="button"
          className="outline-btn font-semibold py-3 px-5 rounded-xl text-sm"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          type="button"
          disabled={!isValid}
          className={`flex-1 font-bold py-3 px-6 rounded-xl text-sm transition-all ${
            isValid
              ? "purple-btn text-white"
              : "bg-white/5 text-gray-600 cursor-not-allowed"
          }`}
        >
          {isLast ? "Submit Application" : "Next →"}
        </button>
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
  onEnterSubmit,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  onEnterSubmit?: () => void;
}) {
  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && onEnterSubmit) {
      e.preventDefault();
      onEnterSubmit();
    }
  };

  if (question.type === "yesno") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {["Yes", "No"].map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`rounded-xl border py-5 px-4 font-bold text-base transition-all ${
                selected
                  ? "bg-purple-500/20 border-purple-500/60 text-white"
                  : "bg-white/3 border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 text-gray-200"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "single" && question.options) {
    return (
      <div className="flex flex-col gap-3">
        {question.options.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`text-left rounded-xl border py-3.5 px-4 text-sm transition-all ${
                selected
                  ? "bg-purple-500/20 border-purple-500/60 text-white"
                  : "bg-white/3 border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 text-gray-200"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "text") {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleEnter}
        autoFocus
        className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 focus:outline-none rounded-xl px-4 py-3.5 text-white text-base placeholder:text-gray-600"
        placeholder="Type your answer…"
      />
    );
  }

  if (question.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        autoFocus
        className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 focus:outline-none rounded-xl px-4 py-3 text-white text-base placeholder:text-gray-600 resize-none"
        placeholder="Type your answer…"
      />
    );
  }

  if (question.type === "email") {
    return (
      <input
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleEnter}
        autoFocus
        autoComplete="email"
        className="w-full bg-white/5 border border-white/10 focus:border-purple-500/60 focus:outline-none rounded-xl px-4 py-3.5 text-white text-base placeholder:text-gray-600"
        placeholder="you@example.com"
      />
    );
  }

  if (question.type === "phone") {
    return (
      <div className="apply-phone-input">
        <PhoneInput
          value={value || undefined}
          onChange={(v) => onChange(v ?? "")}
          defaultCountry="US"
          international
          countryCallingCodeEditable={false}
          placeholder="Enter phone number"
        />
      </div>
    );
  }

  return null;
}

function DoneScreen() {
  return (
    <div className="text-center quiz-fade-up">
      <div className="text-6xl mb-5">🎉</div>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
        Application Submitted!
      </h1>
      <p className="text-gray-300 text-base leading-relaxed mb-8">
        Thank you for applying! Our team will review your application and if
        you&apos;re a good fit, we&apos;ll reach out to you within 24 hours with
        next steps.
      </p>
      <Link
        href="/dashboard"
        className="purple-btn text-white font-bold py-3 px-8 rounded-xl text-sm inline-block"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}

function ErrorScreen({
  message,
  limited,
  onRetry,
}: {
  message: string;
  limited: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="text-center quiz-fade-up">
      <div className="text-5xl mb-5">{limited ? "🛑" : "⚠️"}</div>
      <h1 className="text-2xl font-extrabold text-white mb-3">
        {limited ? "Daily Limit Reached" : "Submission Failed"}
      </h1>
      <p className="text-gray-300 text-sm leading-relaxed mb-8">{message}</p>
      {!limited && (
        <button
          onClick={onRetry}
          className="purple-btn text-white font-bold py-3 px-8 rounded-xl text-sm"
        >
          Try Again
        </button>
      )}
      <div className="mt-4">
        <Link
          href="/dashboard"
          className="text-gray-500 hover:text-purple-400 text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
