// tokens/scales.ts
export type StrengthBucket = "boss" | "steady" | "boost" | "support";

export const THRESHOLDS = {
  boss: 0.70,
  steady: 0.55, // [0.55–0.69]
  boost: 0.40,  // [0.40–0.54]
};

export function bucket(score: number): StrengthBucket {
  const v = Math.max(0, Math.min(1, Number(score) || 0));
  if (v >= THRESHOLDS.boss) return "boss";
  if (v >= THRESHOLDS.steady) return "steady";
  if (v >= THRESHOLDS.boost) return "boost";
  return "support";
}

export function label(score: number) {
  switch (bucket(score)) {
    case "boss":    return "Very strong • Boss Mode";
    case "steady":  return "Average to good • Holding Steady";
    case "boost":   return "Weak • Needs a Boost";
    default:        return "Very weak • Needs Support";
  }
}

/** Badge classes tuned to your Badge.tsx “border + bg + text” approach. */
export function badgeClass(score: number) {
  const b = bucket(score);
  // build with utility classes to match your palette/hover (emerald/violet/amber/rose)
  if (b === "boss")    return "border-emerald-400/25 bg-emerald-300/10 text-emerald-300";
  if (b === "steady")  return "border-violet-400/25 bg-violet-300/10 text-violet-300";
  if (b === "boost")   return "border-amber-400/25 bg-amber-300/10 text-amber-200";
  return                 "border-rose-400/25 bg-rose-300/10 text-rose-300";
}

export function isBoss(score: number) {
  return bucket(score) === "boss";
}
