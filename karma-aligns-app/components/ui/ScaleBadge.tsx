// components/ui/ScaleBadge.tsx
import * as React from "react";
import Badge from "@/components/ui/Badge";
import { bucket } from "@/components/tokens/scales";

export default function ScaleBadge({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const b = bucket(value);

  // Text per bucket
  const text =
    b === "boss"
      ? "Very strong • 👑 Boss Mode"
      : b === "steady"
      ? "Average to good • Holding Steady"
      : b === "boost"
      ? "Weak • Needs a Boost"
      : "Very weak • Needs Support";

  // Classes per bucket (exact per your spec)
  // components/ui/ScaleBadge.tsx
  const tone =
  b === "boss"
    ? "text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-emerald-400/25 bg-emerald-300/10 !text-emerald-300"
    : b === "steady"
    ? "text-[10px] px-2 py-0.5 rounded-full border border-violet-400/25 bg-violet-300/10 !text-violet-300"
    : b === "boost"
    ? "text-[10px] px-2 py-0.5 rounded-full border border-amber-400/25 bg-amber-300/10 !text-amber-300"
    : "text-[10px] px-2 py-0.5 rounded-full border border-rose-400/25 bg-rose-300/10 !text-rose-300";
  return (
    <Badge className={`${tone} ${className}`}>
      {text}
    </Badge>
  );
}
