"use client";
import * as React from "react";
import ScaleBadge from "@/components/ui/ScaleBadge";
import { bucket } from "@/components/tokens/scales";

/** Pops in only when Boss Mode */
export default function AnimatedScaleBadge({ value }: { value: number }) {
  const isBoss = bucket(value) === "boss";
  return (
    <div
      className={[
        "inline-flex will-change-transform",
        isBoss ? "animate-[pop_380ms_ease-out]" : "",
      ].join(" ")}
    >
      <ScaleBadge value={value} />
      <style jsx>{`
        @keyframes pop {
          0% { transform: scale(.92); filter: drop-shadow(0 0 0 rgba(16,185,129,.0)); }
          60% { transform: scale(1.06); filter: drop-shadow(0 0 12px rgba(16,185,129,.35)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(16,185,129,.0)); }
        }
      `}</style>
    </div>
  );
}
