"use client";

/**
 * Shared 6-slice prize wheel used on /downsell-1 ($27) and /downsell-2 ($97).
 * Rigged two-spin sequence:
 *   1) First click → spins to `firstSpinTargetIndex` (typically a "SPIN AGAIN" tease slice)
 *   2) Second click → spins to `secondSpinTargetIndex` (the actual prize), then fires `onComplete`
 *
 * The wheel renders its own SVG, spin button, intermediate tease message,
 * and keyframes. After the final spin, the spin button is hidden — the
 * parent should render the victory/purchase box once `onComplete` fires.
 *
 * Slice geometry is fixed at 60° each (6 slices). Slice center for index `i`
 * is at `i * 60 + 30` degrees measured clockwise from the top.
 */

import { useState } from "react";

export interface SpinWheelSlice {
  label: string;
  color: string;
}

interface SpinWheelProps {
  slices: SpinWheelSlice[];
  firstSpinTargetIndex: number;
  secondSpinTargetIndex: number;
  teaseMessage?: string;
  initialButtonLabel?: string;
  retryButtonLabel?: string;
  spinningLabel?: string;
  onComplete: () => void;
}

const CX = 200;
const CY = 200;
const WHEEL_R = 160;
const LIGHT_R = 185;
const RING_R = 195;
const NUM_LIGHTS = 16;
const TEXT_RADIUS = 120;

const FIRST_SPIN_DURATION_MS = 5000;
const SECOND_SPIN_DURATION_MS = 4000;
const FIRST_SPIN_EXTRA_TURNS = 4;
const SECOND_SPIN_EXTRA_TURNS = 3;

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
  return `M ${CX} ${CY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

/**
 * Returns the total rotation needed so that the wheel rests with `sliceIndex`
 * under the top pointer. Includes `extraTurns` full revolutions for spectacle.
 * `currentRotation` is the wheel's current absolute rotation.
 */
function rotationForSlice(
  currentRotation: number,
  sliceIndex: number,
  extraTurns: number,
): number {
  const sliceCenterDeg = sliceIndex * 60 + 30;
  // Wheel rotates clockwise; pointer at top. We want
  // (rotation mod 360) === (360 - sliceCenterDeg) mod 360.
  const targetRest = (360 - sliceCenterDeg) % 360;
  const currentRest = ((currentRotation % 360) + 360) % 360;
  const delta = extraTurns * 360 + ((targetRest - currentRest + 360) % 360);
  return currentRotation + delta;
}

export function SpinWheel({
  slices,
  firstSpinTargetIndex,
  secondSpinTargetIndex,
  teaseMessage = "Almost! Try one more time 🍀",
  initialButtonLabel = "🎰 SPIN THE WHEEL",
  retryButtonLabel = "🎰 SPIN AGAIN",
  spinningLabel = "Spinning...",
  onComplete,
}: SpinWheelProps) {
  const [spinCount, setSpinCount] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showTease, setShowTease] = useState(false);
  const [finished, setFinished] = useState(false);

  function handleSpin() {
    if (isSpinning || finished) return;
    setIsSpinning(true);
    setShowTease(false);

    if (spinCount === 0) {
      const next = rotationForSlice(
        rotation,
        firstSpinTargetIndex,
        FIRST_SPIN_EXTRA_TURNS,
      );
      setRotation(next);
      setTimeout(() => {
        setIsSpinning(false);
        setShowTease(true);
        setSpinCount(1);
      }, FIRST_SPIN_DURATION_MS);
    } else if (spinCount === 1) {
      const next = rotationForSlice(
        rotation,
        secondSpinTargetIndex,
        SECOND_SPIN_EXTRA_TURNS,
      );
      setRotation(next);
      setTimeout(() => {
        setIsSpinning(false);
        setSpinCount(2);
        setFinished(true);
        onComplete();
      }, SECOND_SPIN_DURATION_MS);
    }
  }

  const buttonText = isSpinning
    ? spinningLabel
    : spinCount === 0
      ? initialButtonLabel
      : retryButtonLabel;
  const isIdle = !isSpinning && spinCount === 0;
  const showSpinButton = !finished;

  return (
    <>
      <div
        className="relative w-80 h-80 sm:w-96 sm:h-96 mx-auto mt-10"
        style={{
          filter:
            "drop-shadow(0 0 40px rgba(139,92,246,0.5)) drop-shadow(0 0 80px rgba(251,191,36,0.2))",
          animation: isIdle ? "spinwheelGentlePulse 2s ease-in-out infinite" : "none",
        }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <defs>
            <linearGradient id="spinwheelHubGradient" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>
            <linearGradient id="spinwheelPointerGradient" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <filter id="spinwheelLightGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="spinwheelPointerShadow" x="-50%" y="-50%" width="200%" height="200%">
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

          {/* OUTER RING (stationary) */}
          <circle cx={CX} cy={CY} r={RING_R} fill="#1a0b2e" stroke="#8b5cf6" strokeWidth="2" />

          {/* 16 RIM LIGHTS (stationary, animated opacity) */}
          {Array.from({ length: NUM_LIGHTS }).map((_, i) => {
            const angle = i * (360 / NUM_LIGHTS);
            const pos = angleToXY(angle, LIGHT_R);
            return (
              <circle
                key={`light-${i}`}
                cx={pos.x}
                cy={pos.y}
                r="5"
                fill="white"
                filter="url(#spinwheelLightGlow)"
                style={{
                  animation: isSpinning
                    ? "spinwheelLightSpin 0.6s ease-in-out infinite"
                    : "spinwheelLightIdle 2.5s ease-in-out infinite",
                  animationDelay: `${i * (isSpinning ? 0.04 : 0.12)}s`,
                }}
              />
            );
          })}

          {/* ROTATING GROUP — slices, dividers, labels */}
          <g
            style={{
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              willChange: "transform",
              transition:
                spinCount === 0
                  ? `transform ${FIRST_SPIN_DURATION_MS / 1000}s cubic-bezier(0.15, 0.85, 0.25, 1)`
                  : `transform ${SECOND_SPIN_DURATION_MS / 1000}s cubic-bezier(0.17, 0.67, 0.21, 1)`,
            }}
          >
            {slices.map((slice, i) => (
              <path
                key={`slice-${i}`}
                d={slicePath(i * 60, i * 60 + 60, WHEEL_R)}
                fill={slice.color}
              />
            ))}
            {slices.map((_, i) => {
              const end = angleToXY(i * 60, WHEEL_R);
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
            {slices.map((slice, i) => {
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

          {/* CENTRAL HUB (stationary) */}
          <circle
            cx={CX}
            cy={CY}
            r="35"
            fill="url(#spinwheelHubGradient)"
            stroke="#fbbf24"
            strokeWidth="3"
            filter="url(#spinwheelPointerShadow)"
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

          {/* POINTER (stationary, on top) */}
          <g filter="url(#spinwheelPointerShadow)">
            <path
              d="M 182 10 L 218 10 L 200 50 Z"
              fill="url(#spinwheelPointerGradient)"
              stroke="#78350f"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {showTease && teaseMessage && (
        <p
          className="text-lg text-amber-300 mt-8 font-medium"
          style={{ animation: "spinwheelFadeInUp 0.6s ease-out" }}
        >
          {teaseMessage}
        </p>
      )}

      {showSpinButton && (
        <div className="mt-8">
          <button
            type="button"
            onClick={handleSpin}
            disabled={isSpinning}
            className="bg-green-500 hover:bg-green-600 disabled:bg-neutral-700 disabled:cursor-not-allowed transition-colors text-white font-bold text-xl px-12 py-5 rounded-xl shadow-lg shadow-green-500/20"
          >
            {buttonText}
          </button>
        </div>
      )}

      <style>{`
        @keyframes spinwheelFadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinwheelLightSpin {
          0%, 100% { opacity: 0.25; }
          50%      { opacity: 1; }
        }
        @keyframes spinwheelLightIdle {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @keyframes spinwheelGentlePulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.03); }
        }
      `}</style>
    </>
  );
}
