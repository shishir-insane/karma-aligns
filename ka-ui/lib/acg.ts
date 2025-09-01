// lib/acg.ts
export const PLANET_COLORS: Record<string, string> = {
    Sun: "#facc15",      // amber-300
    Moon: "#93c5fd",     // blue-300
    Mercury: "#22c55e",  // green-500
    Venus: "#ec4899",    // pink-500
    Mars: "#ef4444",     // red-500
    Jupiter: "#f97316",  // orange-500
    Saturn: "#64748b",   // slate-500
    Rahu: "#a78bfa",     // violet-400
    Ketu: "#34d399",     // emerald-400
  }
  
  export const PLANET_GLYPHS: Record<string, string> = {
    Sun: "☉",
    Moon: "☽",
    Mercury: "☿",
    Venus: "♀",
    Mars: "♂",
    Jupiter: "♃",
    Saturn: "♄",
    Rahu: "☊",
    Ketu: "☋",
  }
  
  export type LineType = "ASC" | "MC" | "DSC" | "IC"
  
  export const LINE_STYLE: Record<LineType, { dashArray?: string; weight: number }> = {
    ASC: { dashArray: "6 4", weight: 2 },
    MC:  { dashArray: undefined, weight: 2.5 },
    DSC: { dashArray: "2 6", weight: 2 },
    IC:  { dashArray: "8 3 1 3", weight: 2 },
  }
  