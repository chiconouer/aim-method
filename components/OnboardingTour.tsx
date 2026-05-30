"use client";

import { useEffect, useRef, useState } from "react";

interface Step {
  id: string;
  body: string;
  /** CSS selector for the element to spotlight. Omit for a centered card. */
  targetSelector?: string;
  /** Padding around the spotlight cutout. */
  padding?: number;
  /** Primary CTA label. Defaults to "Next". */
  primaryCta?: string;
}

const STORAGE_KEY = "aim_onboarding_done";

const STEPS: Step[] = [
  {
    id: "welcome",
    body: "Welcome to AIM Method 👋  Let's take 10 seconds to show you around.",
    primaryCta: "Show me",
  },
  {
    id: "course",
    body: "This is your course. Pick up right where you left off, anytime.",
    targetSelector: "[data-tour='continue-card']",
    padding: 8,
  },
  {
    id: "assistant",
    body: "Meet AIM Assistant — your 24/7 support. Tap here anytime you have a question.",
    targetSelector: "[data-tour='ai-assistant-button']",
    padding: 12,
  },
  {
    id: "start",
    body: "Ready? Start your first lesson here. Modules unlock as you complete each quiz.",
    targetSelector: "[data-tour='continue-button']",
    padding: 6,
    primaryCta: "Let's go",
  },
];

export function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // On mount: only show if the flag isn't set
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // Tiny delay so the page paint finishes — mostly cosmetic
        const t = setTimeout(() => setVisible(true), 250);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage may be unavailable (private mode etc). Skip tour silently.
    }
  }, []);

  // Find + measure the target element for the current step. Retries while the
  // element is mounting, then degrades to "no spotlight, centered tooltip" if
  // the element never appears (e.g. layout difference, A/B variant).
  useEffect(() => {
    if (!visible) return;
    const step = STEPS[stepIndex];
    if (!step.targetSelector) {
      setTargetRect(null);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const measure = () => {
      if (cancelled) return;
      const el = document.querySelector(step.targetSelector!);
      if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
        // Let the scroll settle before measuring
        setTimeout(() => {
          if (cancelled) return;
          const elNow = document.querySelector(step.targetSelector!);
          if (elNow) setTargetRect(elNow.getBoundingClientRect());
        }, 320);
      } else if (attempts < 8) {
        attempts++;
        setTimeout(measure, 120);
      } else {
        // Graceful degrade: no spotlight, centered tooltip
        setTargetRect(null);
      }
    };

    measure();
    return () => {
      cancelled = true;
    };
  }, [stepIndex, visible]);

  // Keep the spotlight aligned if the viewport changes (orientation, scroll
  // while a step is open, keyboard, etc.)
  useEffect(() => {
    if (!visible) return;
    const step = STEPS[stepIndex];
    if (!step.targetSelector) return;

    const reposition = () => {
      const el = document.querySelector(step.targetSelector!);
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [stepIndex, visible]);

  function finish() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  function next() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      finish();
    }
  }

  if (!visible) return null;

  const step = STEPS[stepIndex];
  const padding = step.padding ?? 8;

  return (
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding tour"
    >
      {/* Dim everything except the spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        aria-hidden="true"
      >
        <defs>
          <mask id="onboarding-spotlight">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={Math.max(0, targetRect.left - padding)}
                y={Math.max(0, targetRect.top - padding)}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#onboarding-spotlight)"
        />
        {targetRect && (
          <rect
            x={Math.max(0, targetRect.left - padding)}
            y={Math.max(0, targetRect.top - padding)}
            width={targetRect.width + padding * 2}
            height={targetRect.height + padding * 2}
            rx="14"
            ry="14"
            fill="none"
            stroke="rgba(139, 92, 246, 0.7)"
            strokeWidth="2"
            className="onboarding-spotlight-ring"
          />
        )}
      </svg>

      <Tooltip
        key={step.id}
        targetRect={targetRect}
        body={step.body}
        primary={step.primaryCta ?? "Next"}
        stepIndex={stepIndex}
        total={STEPS.length}
        onNext={next}
        onSkip={finish}
      />
    </div>
  );
}

function Tooltip({
  targetRect,
  body,
  primary,
  stepIndex,
  total,
  onNext,
  onSkip,
}: {
  targetRect: DOMRect | null;
  body: string;
  primary: string;
  stepIndex: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Measure ourselves and decide where to land relative to the target.
  // Done as a layout effect so the tooltip is positioned on the same paint
  // as it's revealed (avoids a flicker).
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const tooltipRect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 16;

    if (!targetRect) {
      // Centered (welcome step or graceful-degrade)
      setPos({
        top: Math.max(margin, (vh - tooltipRect.height) / 2),
        left: Math.max(margin, (vw - tooltipRect.width) / 2),
      });
      return;
    }

    // Try below the target first; flip above if it would overflow
    let top = targetRect.bottom + margin;
    if (top + tooltipRect.height > vh - margin) {
      top = targetRect.top - tooltipRect.height - margin;
    }
    if (top < margin) {
      // Doesn't fit above or below — center vertically (small target,
      // tall tooltip, tiny viewport)
      top = Math.max(margin, (vh - tooltipRect.height) / 2);
    }

    // Center horizontally on the target, clamped to the viewport
    let left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    left = Math.max(margin, Math.min(left, vw - tooltipRect.width - margin));

    setPos({ top, left });
  }, [targetRect, body, stepIndex]);

  return (
    <div
      ref={ref}
      className="absolute bg-[#111111] border border-purple-500/40 rounded-2xl p-5 w-[320px] max-w-[calc(100vw-2rem)] shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-[top,left,opacity] duration-300 ease-out"
      style={
        pos
          ? { top: pos.top, left: pos.left, opacity: 1 }
          : { top: -9999, left: -9999, opacity: 0 }
      }
    >
      <p className="text-purple-400 text-[10px] font-bold uppercase tracking-wider mb-2">
        Step {stepIndex + 1} of {total}
      </p>
      <p className="text-white text-sm leading-relaxed mb-5 whitespace-pre-wrap">
        {body}
      </p>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="text-gray-500 hover:text-purple-400 text-sm transition-colors"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={onNext}
          className="purple-btn text-white font-bold py-2.5 px-6 rounded-xl text-sm"
        >
          {primary}
        </button>
      </div>
    </div>
  );
}
