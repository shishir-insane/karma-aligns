import * as React from "react";

export interface StrengthRingProps {
  value: number;          // 0..1
  size?: number;          // px
  stroke?: number;        // px
  boss?: boolean;         // glow + emerald stroke
  trackClassName?: string;
  barClassName?: string;
}

export default function StrengthRing({
  value,
  size = 64,
  stroke = 8,
  boss = false,
  trackClassName = "stroke-white/10",
  barClassName,
}: StrengthRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  const dash = v * c;
  const bar =
    barClassName ??
    (boss
      ? "stroke-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,.6)]"
      : "stroke-violet-300/80");

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        className={`fill-transparent ${trackClassName}`}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        className={`fill-transparent ${bar}`}
      />
    </svg>
  );
}
