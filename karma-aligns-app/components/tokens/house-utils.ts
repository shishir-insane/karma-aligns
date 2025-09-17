// components/results/cards/house-utils.ts
export type ScaleTone = "amber" | "green" | "red" | "cyan" | "violet" | "blue";

/** Map normalized 0..1 to a 0..360 conic fill */
export const scoreToConicDeg = (score: number) =>
  Math.round(Math.min(1, Math.max(0, score)) * 360);

/** Bucket score → tone + label */
export function scoreToTone(score: number): ScaleTone {
  if (score >= 0.8) return "green";
  if (score >= 0.6) return "cyan";
  if (score >= 0.4) return "amber";
  if (score >= 0.2) return "violet";
  return "red";
}

export function scoreToLabel(score: number): string {
  if (score >= 0.8) return "Dominant • Leverages Momentum";
  if (score >= 0.6) return "Strong • Advantageous";
  if (score >= 0.4) return "Balanced • Watch Trends";
  if (score >= 0.2) return "Weak • Needs a Boost";
  return "Critical • Intervene";
}

/** Level text like “Bhava Bala total • Level 2/5” */
export const levelText = (level: number) =>
  `Bhava Bala total • Level ${level}/5`;

/** Build a 6-axis radar polygon from normalized values[6] on the same grid used by the card */
export function valuesToHexPoints(values: number[]): string {
  // Expect 6 values normalized 0..1 in this axis order (top, top-right, bottom-right, bottom, bottom-left, top-left)
  const cx = 80, cy = 80, maxR = 62; // matches the SVG in the card
  const angles = [ -90, -30, 30, 90, 150, -150 ].map(a => (a * Math.PI) / 180);

  const pts = values.map((v, i) => {
    const r = Math.max(0, Math.min(1, v)) * maxR;
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    return `${x},${y}`;
  });

  return pts.join(" ");
}
