// lib/acg.ts
export type LineType = "ASC" | "MC" | "DSC" | "IC" | string

// Lowercase keys for resilient lookups
const BASE_COLORS: Record<string, string> = {
  sun: "#facc15",
  moon: "#93c5fd",
  mercury: "#22c55e",
  venus: "#ec4899",
  mars: "#ef4444",
  jupiter: "#f97316",
  saturn: "#64748b",
  rahu: "#a78bfa",
  ketu: "#34d399",
  uranus: "#06b6d4",
  neptune: "#3b82f6",
  pluto: "#8b5cf6",
  chiron: "#14b8a6",
  lilith: "#f43f5e",
}

const BASE_GLYPHS: Record<string, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  rahu: "☊",
  ketu: "☋",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
  chiron: "⚷",
  lilith: "⚸",
}

export function getPlanetColor(name: string): string {
  const k = (name || "").toLowerCase().trim()
  return BASE_COLORS[k] ?? "#0ea5e9"
}

export function getPlanetGlyph(name: string): string {
  const k = (name || "").toLowerCase().trim()
  return BASE_GLYPHS[k] ?? "•"
}

// Known styles + default for unknown types
const KNOWN_STYLES: Record<string, { dashArray?: string; weight: number }> = {
  ASC: { dashArray: "6 4", weight: 2 },
  MC:  { dashArray: undefined, weight: 2.5 },
  DSC: { dashArray: "2 6", weight: 2 },
  IC:  { dashArray: "8 3 1 3", weight: 2 },
}

export function getLineStyle(type: LineType) {
  return KNOWN_STYLES[(type || "").toUpperCase()] ?? { dashArray: "4 4", weight: 2 }
}

/* ---------- Legacy exports to keep existing imports working ---------- */
// If your code imports these, it will still compile.
export const PLANET_COLORS: Record<string, string> = {
  Sun: BASE_COLORS.sun, Moon: BASE_COLORS.moon, Mercury: BASE_COLORS.mercury, Venus: BASE_COLORS.venus,
  Mars: BASE_COLORS.mars, Jupiter: BASE_COLORS.jupiter, Saturn: BASE_COLORS.saturn,
  Rahu: BASE_COLORS.rahu, Ketu: BASE_COLORS.ketu,
  Uranus: BASE_COLORS.uranus, Neptune: BASE_COLORS.neptune, Pluto: BASE_COLORS.pluto,
  Chiron: BASE_COLORS.chiron, Lilith: BASE_COLORS.lilith,
}

export const PLANET_GLYPHS: Record<string, string> = {
  Sun: BASE_GLYPHS.sun, Moon: BASE_GLYPHS.moon, Mercury: BASE_GLYPHS.mercury, Venus: BASE_GLYPHS.venus,
  Mars: BASE_GLYPHS.mars, Jupiter: BASE_GLYPHS.jupiter, Saturn: BASE_GLYPHS.saturn,
  Rahu: BASE_GLYPHS.rahu, Ketu: BASE_GLYPHS.ketu,
  Uranus: BASE_GLYPHS.uranus, Neptune: BASE_GLYPHS.neptune, Pluto: BASE_GLYPHS.pluto,
  Chiron: BASE_GLYPHS.chiron, Lilith: BASE_GLYPHS.lilith,
}

// Classic constant used by legend; safe to keep exporting
export const LINE_STYLE: Record<Exclude<LineType, string>, { dashArray?: string; weight: number }> = {
  ASC: KNOWN_STYLES.ASC,
  MC: KNOWN_STYLES.MC,
  DSC: KNOWN_STYLES.DSC,
  IC: KNOWN_STYLES.IC,
}
