"use client";

import * as React from "react";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";
import AnimatedScaleBadge from "@/components/ui/AnimatedScaleBadge";
import StrengthRing from "@/components/ui/StrengthRing";

/** Props that enable the built-in LeanCard layout (optional — still supports children) */
type LeanProps = {
  /** Title shown at the top-left (e.g., "Lagna • Self & Vitality" or "Sun") */
  title?: React.ReactNode;
  /** Small theme chips under the title */
  tags?: string[];
  /** 0–1 normalized score; drives ring + badge tones */
  score?: number;
  /** 1–2 line summary sentence */
  oneLiner?: React.ReactNode;
  /** CTA label (default: "View Spotlight") */
  ctaLabel?: React.ReactNode;
  /** Fired when CTA clicked */
  onOpen?: () => void;
  /** Increase donut size (px). We render a wrapper so StrengthRing doesn’t need a size prop */
  ringSize?: number;
};

type Props = React.PropsWithChildren<
  {
    /** If children are provided, we render them (full backward compatibility) */
    children?: React.ReactNode;
    className?: string;
  } & LeanProps
>;

export default function BossHouseCard({
  children,
  className,
  title,
  tags,
  score,
  oneLiner,
  ctaLabel = "View Spotlight",
  onOpen,
  ringSize = 72,
}: Props) {
  // If you supplied children, render old behavior
  if (children) {
    return (
      <div
        className={[
          "rounded-2xl border bg-white/5",
          // boss glow frame
          "border-emerald-500/30 shadow-[0_0_0_1px_rgba(16,185,129,.25),0_12px_40px_-12px_rgba(16,185,129,.35)]",
          "p-4 transition-colors hover:bg-white/7.5",
          className || "",
        ].join(" ")}
      >
        {children}
      </div>
    );
  }

  // Lean layout
  return (
    <div
      className={[
        "rounded-2xl border bg-white/5",
        "border-emerald-500/30 shadow-[0_0_0_1px_rgba(16,185,129,.25),0_12px_40px_-12px_rgba(16,185,129,.35)]",
        "p-4 transition-colors hover:bg-white/7.5",
        className || "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {title ? <h3 className="font-heading text-base leading-tight">{title}</h3> : null}
          {tags && tags.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </div>
          ) : null}
        </div>
        {typeof score === "number" ? <AnimatedScaleBadge value={score} /> : null}
      </div>

      {/* Ring + one-liner */}
      {(typeof score === "number" || oneLiner) && (
        <div className="mt-4 flex items-center gap-4">
          {typeof score === "number" ? (
            <div style={{ width: ringSize, height: ringSize }} className="shrink-0 grid place-items-center">
              <StrengthRing value={score} boss />
            </div>
          ) : null}
          {oneLiner ? <p className="text-sm opacity-90">{oneLiner}</p> : null}
        </div>
      )}

      {/* CTA */}
      {onOpen ? (
        <div className="mt-4">
          <Button size="sm" variant="secondary" onClick={onOpen}>
            {ctaLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
