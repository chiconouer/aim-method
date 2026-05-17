"use client";

import { useState } from "react";

type Prize = "spin_again" | "100_off" | null;

// Slices listed clockwise starting at the TOP (angles measured clockwise from 12 o'clock).
// Slice i spans (i*60)° to ((i+1)*60)°; center is at (i*60 + 30)°.
const SLICES = [
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" }, //   0 –  60°  (center  30°)
  { label: "$50 OFF",        color: "#4c1d95" }, //  60 – 120°  (center  90°)
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" }, // 120 – 180°  (center 150°)
  { label: "$100 OFF",       color: "#fbbf24" }, // 180 – 240°  (center 210°) ← highlight (gold)
  { label: "FREE BONUS",     color: "#8b5cf6" }, // 240 – 300°  (center 270°)
  { label: "TRY LATER",      color: "#4c1d95" }, // 300 – 360°  (center 330°)
];

const CX = 200;
const CY = 200;
const WHEEL_R = 160;
const LIGHT_R = 185;
const RING_R = 195;
const NUM_LIGHTS = 16;
const TEXT_RADIUS = 120; // distance from center where label sits (well inside the slice)

// Angle is measured CLOCKWISE from the top (12 o'clock). Returns SVG x/y.
function angleToXY(angleDegFromTop: number, radius: number) {
  const rad = (angleDegFromTop * Math.PI) / 180;
  return {
    x: CX + radius * Math.sin(rad),
    y: CY - radius * Math.cos(rad),
  };
}

function slicePath(startDeg: number, endDeg: number, radius: number): string {
  const start = angleToXY(startDeg, radius);
  const end = angleToXY(endDeg, radius);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  // sweep flag 1 = clockwise (matches our angle convention)
  return `M ${CX} ${CY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export default function DownsellPage() {
  const [spinCount, setSpinCount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prizeWon, setPrizeWon] = useState<Prize>(null);

  function handleSpin() {
    if (isSpinning) return;

    setIsSpinning(true);
    setPrizeWon(null);

    if (spinCount === 0) {
      // 1ª spin: stops on SPIN AGAIN (slice 1, center 30°)
      //   target rotation mod 360 = 360 − 30 = 330
      //   1770 mod 360 = 330  ✓
      setRotation(1770);
      setTimeout(() => {
        setIsSpinning(false);
        setPrizeWon("spin_again");
        setSpinCount(1);
      }, 4000);
    } else if (spinCount === 1) {
      // 2ª spin: stops on $100 OFF (slice 4, center 210°)
      //   target rotation mod 360 = 360 − 210 = 150
      //   3030 mod 360 = 150  ✓  (3 extra turns + 180° from previous resting angle)
      setRotation(3030);
      setTimeout(() => {
        setIsSpinning(false);
        setPrizeWon("100_off");
        setSpinCount(2);
      }, 4000);
    }
  }

  const buttonText = isSpinning
    ? "Spinning..."
    : spinCount === 0
    ? "🎰 SPIN THE WHEEL"
    : "🎰 SPIN AGAIN";

  const showSpinButton = prizeWon !== "100_off";
  const isIdle = !isSpinning && spinCount === 0 && prizeWon === null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-12 sm:py-16">
      <div className="max-w-2xl mx-auto text-center">

        {/* HEADLINE */}
        <h1 className="neon-purple text-4xl sm:text-5xl font-bold leading-tight mt-12">
          It&apos;s Now or Never
        </h1>

        {/* SUBHEADLINE */}
        <p className="text-xl text-neutral-300 mt-4">
          Here&apos;s the Discount You Needed
        </p>

        {/* BODY */}
        <p className="text-base text-neutral-200 mt-8 max-w-xl mx-auto leading-relaxed">
          I know having me create your AI model could accelerate your path by 5x — because you&apos;d already have a 100% professional model built personally by me. That&apos;s why I want to give you one more chance to unlock an extra $100 discount.
        </p>

        {/* CTA TEXT */}
        <p className="neon-purple text-lg font-semibold mt-6">
          Want to test your luck?
        </p>

        {/* WHEEL */}
        <div
          className="relative w-80 h-80 sm:w-96 sm:h-96 mx-auto mt-10"
          style={{
            filter:
              "drop-shadow(0 0 40px rgba(139,92,246,0.5)) drop-shadow(0 0 80px rgba(251,191,36,0.2))",
            animation: isIdle ? "gentle-pulse 2s ease-in-out infinite" : "none",
          }}
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <defs>
              <linearGradient id="hubGradient" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#4c1d95" />
              </linearGradient>
              <linearGradient id="pointerGradient" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <filter id="lightGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="pointerShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                <feOffset dx="0" dy="3" result="offsetBlur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.5" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* OUTER RING (stationary): filled dark-purple disk with neon stroke */}
            <circle
              cx={CX}
              cy={CY}
              r={RING_R}
              fill="#1a0b2e"
              stroke="#8b5cf6"
              strokeWidth="2"
            />

            {/* 16 LIGHTS around the rim (stationary, animated opacity) */}
            {Array.from({ length: NUM_LIGHTS }).map((_, i) => {
              const angle = i * (360 / NUM_LIGHTS); // 22.5° apart
              const pos = angleToXY(angle, LIGHT_R);
              return (
                <circle
                  key={`light-${i}`}
                  cx={pos.x}
                  cy={pos.y}
                  r="5"
                  fill="white"
                  filter="url(#lightGlow)"
                  style={{
                    animation: isSpinning
                      ? "lightSpin 0.6s ease-in-out infinite"
                      : "lightIdle 2.5s ease-in-out infinite",
                    animationDelay: `${i * (isSpinning ? 0.04 : 0.12)}s`,
                  }}
                />
              );
            })}

            {/* ROTATING WHEEL GROUP — slices, dividers, text */}
            <g
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: `${CX}px ${CY}px`,
                transition: "transform 4s cubic-bezier(0.17, 0.67, 0.21, 1)",
              }}
            >
              {/* Slice fills */}
              {SLICES.map((slice, i) => {
                const startDeg = i * 60;
                const endDeg = startDeg + 60;
                return (
                  <path
                    key={`slice-${i}`}
                    d={slicePath(startDeg, endDeg, WHEEL_R)}
                    fill={slice.color}
                  />
                );
              })}

              {/* White translucent dividers at every slice boundary */}
              {SLICES.map((_, i) => {
                const boundaryDeg = i * 60;
                const end = angleToXY(boundaryDeg, WHEEL_R);
                return (
                  <line
                    key={`div-${i}`}
                    x1={CX}
                    y1={CY}
                    x2={end.x}
                    y2={end.y}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                  />
                );
              })}

              {/* Slice text labels — positioned at (CX, CY - TEXT_RADIUS) and rotated to each slice center */}
              {SLICES.map((slice, i) => {
                const midDeg = i * 60 + 30;
                const isGold = slice.color === "#fbbf24";
                return (
                  <text
                    key={`text-${i}`}
                    x={CX}
                    y={CY - TEXT_RADIUS}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isGold ? "#1a0b2e" : "#ffffff"}
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fontWeight={900}
                    fontSize={isGold ? 18 : 16}
                    stroke={isGold ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)"}
                    strokeWidth="0.5"
                    paintOrder="stroke"
                    transform={`rotate(${midDeg} ${CX} ${CY})`}
                    style={{ letterSpacing: "0.5px" }}
                  >
                    {slice.label}
                  </text>
                );
              })}
            </g>

            {/* CENTRAL HUB (stationary, on top of rotating layer) */}
            <circle
              cx={CX}
              cy={CY}
              r="35"
              fill="url(#hubGradient)"
              stroke="#fbbf24"
              strokeWidth="3"
              filter="url(#pointerShadow)"
            />
            <text
              x={CX}
              y={CY + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="32"
              fontWeight="bold"
            >
              ✦
            </text>

            {/* POINTER (stationary, OUTSIDE the rotating group) */}
            <g filter="url(#pointerShadow)">
              <path
                d="M 182 10 L 218 10 L 200 50 Z"
                fill="url(#pointerGradient)"
                stroke="#78350f"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        {/* SPIN AGAIN MESSAGE */}
        {prizeWon === "spin_again" && (
          <p
            key="spin-again-msg"
            className="text-lg text-amber-300 mt-8 font-medium"
            style={{ animation: "fadeInUp 0.6s ease-out" }}
          >
            Almost! Try one more time 🍀
          </p>
        )}

        {/* SPIN BUTTON */}
        {showSpinButton && (
          <div className="mt-8">
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className="bg-green-500 hover:bg-green-600 disabled:bg-neutral-700 disabled:cursor-not-allowed transition-colors text-white font-bold text-xl px-12 py-5 rounded-xl shadow-lg shadow-green-500/20"
            >
              {buttonText}
            </button>
          </div>
        )}

        {/* VICTORY + PURCHASE BOX */}
        {prizeWon === "100_off" && (
          <div style={{ animation: "fadeInUp 0.8s ease-out" }}>
            <h2 className="text-3xl font-bold text-green-400 mt-10 animate-pulse">
              🎉 YOU JUST UNLOCKED $100 OFF! 🎉
            </h2>
            <p className="text-base text-neutral-300 mt-3">
              Your special price has been activated
            </p>

            <div className="max-w-md mx-auto mt-8 bg-[#111] border border-green-500/40 rounded-2xl p-8 shadow-lg shadow-green-500/10">
              <p className="text-sm text-neutral-400">Your exclusive price:</p>
              <p className="mt-2">
                <span className="text-5xl font-bold text-green-400">$97</span>
                <span className="text-2xl text-neutral-500 line-through ml-2">$197</span>
              </p>
              <p className="text-sm text-neutral-400 mt-2">
                Save $100 — final offer
              </p>

              {/* TODO: Replace href="#" with real CenterPag/PerfectPay $97 link */}
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 bg-green-500 hover:bg-green-600 transition-colors text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-green-500/30"
              >
                🚀 CLAIM MY DISCOUNT
              </a>
            </div>
          </div>
        )}

        {/* NO THANKS */}
        <div className="mt-12">
          <a
            href="https://course.aimodelmethods.com"
            target="_self"
            className="text-base text-neutral-500 underline hover:text-neutral-300 transition-colors"
          >
            No thanks, take me to the course
          </a>
        </div>

      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lightSpin {
          0%, 100% { opacity: 0.25; }
          50%      { opacity: 1; }
        }
        @keyframes lightIdle {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @keyframes gentle-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
