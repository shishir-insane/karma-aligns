export const HOUSE_THEMES: Record<number, string[]> = {
  1: ["Self", "Body", "Identity"],
  2: ["Finance", "Speech", "Family"],
  3: ["Courage", "Siblings", "Skills"],
  4: ["Home", "Mother", "Emotions"],
  5: ["Creativity", "Children", "Joy"],
  6: ["Service", "Health", "Rivals"],
  7: ["Partnerships", "Contracts", "Public"],
  8: ["Depth", "Change", "Mystery"],
  9: ["Dharma", "Belief", "Mentors"],
  10: ["Career", "Status", "Authority"],
  11: ["Gains", "Networks", "Aspirations"],
  12: ["Rest", "Retreat", "Release"],
};

export const HOUSE_NAMES: Record<number, string> = {
  1: "Lagna • Self & Vitality",
  2: "Wealth & Speech",
  3: "Courage & Siblings",
  4: "Home & Mother",
  5: "Creativity & Children",
  6: "Health & Service",
  7: "Relationships & Public",
  8: "Transformations",
  9: "Dharma & Fortune",
  10: "Career & Status",
  11: "Gains & Networks",
  12: "Loss/Release & Isolation",
};

export type StickerTone = "emerald" | "violet" | "rose" | "amber";

/** Boss stickers for houses (shown when normalized total ≥ 0.70) */
export const HOUSE_STICKERS: Record<number, { emoji: string; label: string; tone?: StickerTone }> = {
  1: { emoji: "🧭", label: "self on point", tone: "emerald" },
  2: { emoji: "💬", label: "values voiced", tone: "violet" },
  3: { emoji: "🏁", label: "bold moves", tone: "amber" },
  4: { emoji: "🏡", label: "rooted & cozy", tone: "emerald" },
  5: { emoji: "🎨", label: "creative main", tone: "emerald" },
  6: { emoji: "🛡️", label: "systems online", tone: "violet" },
  7: { emoji: "🤝", label: "partnership glow", tone: "emerald" },
  8: { emoji: "🧩", label: "deep work buff", tone: "violet" },
  9: { emoji: "📚", label: "lucky learning", tone: "emerald" },
  10: { emoji: "🏔️", label: "career peak", tone: "emerald" },
  11: { emoji: "📈", label: "network gains", tone: "emerald" },
  12: { emoji: "🌙", label: "rest & release pro", tone: "violet" },
};

// Optional – only if you don't already have it
export const PILLAR_LABELS_HOUSE = {
  bhava_drik: {
    genz: "Support Power",
    classical: "Bhāva Drik",
  },
  kendradhi: {
    genz: "Placement Power",
    classical: "Kendradhi",
  },
};

export function significanceLines(id: number, themes: string[]) {
  return [`House ${id} — ${HOUSE_NAMES[id]}.`, `Themes: ${themes.join(", ")}.`];
}

export function whatIfStrong(id: number) {
  const axis =
    id === 1 || id === 7 ? "balance self/others" :
      id === 4 || id === 10 ? "align home/career" :
        id === 5 || id === 11 ? "channel creativity → gains" : "lean into current wins";
  return [
    "STRONG: Expect smoother progress here.",
    `Nudge: ${axis}.`,
    "Double-down on decisions tied to this house in the near term.",
  ];
}

export function whatIfWeak(id: number) {
  const guard =
    id === 6 ? "health & routines" :
      id === 8 ? "intense change; pace yourself" :
        id === 12 ? "rest & boundaries" : "avoid overcommitment";
  return [
    "WEAK: This area may feel underpowered.",
    `Guardrails: Focus on ${guard}.`,
    "Default to maintenance over expansion for now.",
  ];
}
