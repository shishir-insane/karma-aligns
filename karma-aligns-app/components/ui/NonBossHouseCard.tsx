"use client";

import * as React from "react";
import Button from "@/components/ui/Button";
import Pill from "@/components/ui/Pill";
import AnimatedScaleBadge from "@/components/ui/AnimatedScaleBadge";
import StrengthRing from "@/components/ui/StrengthRing";

/** Same lean props as BossHouseCard */
type LeanProps = {
  title?: React.ReactNode;
  tags?: string[];
  score?: number;
  oneLiner?: React.ReactNode;
  ctaLabel?: React.ReactNode;
  onOpen?: () => void;
  ringSize?: number;
};

type Props = React.PropsWithChildren<
  {
    children?: React.ReactNode;
    className?: string;
  } & LeanProps
>;

export default function NonBossHouseCard({
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
  // Back-compat: render children if provided
  if (children) {
    return (
      <div
        className={[
          "rounded-2xl border border-white/10 bg-white/5 p-4",
          "transition-colors hover:bg-white/7.5",
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
        "rounded-2xl border border-white/10 bg-white/5 p-4",
        "transition-colors hover:bg-white/7.5",
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
              <StrengthRing value={score} />
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
