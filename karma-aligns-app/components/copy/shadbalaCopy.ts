// utils/copy/shadbalaCopy.ts
import type { ExtractedPlanet, PlanetId } from "@/components/types/shadbala";
import { PLANET_THEMES, PILLAR_LABELS } from "@/components/tokens/Shadbala";

export function bucket(score: number) {
  if (score >= 0.85) return "S";
  if (score >= 0.70) return "A";
  if (score >= 0.55) return "B";
  if (score >= 0.40) return "C";
  return "D";
}

export function wittyPlanetLine(id: PlanetId, score: number) {
  const b = bucket(score);
  const t = PLANET_THEMES[id]?.[0] ?? "vibes";
  const quips: Record<string,string> = {
    S: `${id} is headlining—${t} on turbo.`,
    A: `${id} in boss posture. Green lights ahead.`,
    B: `${id} is steady. Not flashy, reliably useful.`,
    C: `${id} needs a pep talk. Small rituals > big promises.`,
    D: `${id} on low-power mode. Go gentle, tighten basics.`,
  };
  return quips[b];
}

export function tutorPlanetLine(id: PlanetId, score: number) {
  const pct = Math.round(score * 100);
  return `${id} shows ${pct}% normalized strength. Align activity with its karakas for constructive outcomes.`;
}

/** Spotlight – significance text (short & practical) */
export const planetSignificance: Record<PlanetId, string> = {
  Sun:"Vitality, authority, clarity of purpose, self-expression.",
  Moon:"Mind, emotions, care cycles, receptivity and rhythm.",
  Mars:"Courage, initiation, stamina, decisive action.",
  Mercury:"Intellect, speech, learning, trade, adaptivity.",
  Jupiter:"Wisdom, counsel, growth, faith, meaning.",
  Venus:"Aesthetics, love, harmony, comfort and bonds.",
  Saturn:"Discipline, time, structure, duty, resilience.",
  Rahu:"Edge, innovation, risk, unconventional leaps.",
  Ketu:"Detachment, insight, mysticism, quiet mastery.",
};

/** Spotlight – what to do if strong */
export const ifStrong: Record<PlanetId, string[]> = {
  Sun:[
    "Lead key decisions; take visible ownership.",
    "Plan energy-intense tasks earlier in the day.",
    "Practice generous leadership (share credit).",
  ],
  Moon:[
    "Use consistent sleep/wake cycles.",
    "Batch creative or care tasks around your peak mood time.",
    "Lean into supportive social rhythms.",
  ],
  Mars:[
    "Front-load high-effort tasks; keep sprints short.",
    "Channel heat into training or tough conversations.",
    "Avoid needless conflicts; compete with standards, not people.",
  ],
  Mercury:[
    "Write first, talk second. Clarify in public docs.",
    "Ship small experiments; iterate fast.",
    "Trade or negotiate when your mind is fresh.",
  ],
  Jupiter:[
    "Teach, mentor, or publish a long-form thought.",
    "Make the ‘big positive’ decision you’ve deferred.",
    "Practice ethical growth: widen the pie.",
  ],
  Venus:[
    "Polish user-facing details; aesthetics compound trust.",
    "Repair a relationship or nurture one on the edge.",
    "Invest in comfort that boosts output (ergonomics, ambience).",
  ],
  Saturn:[
    "Design a routine you can keep for 90 days.",
    "Choose one constraint; honor it daily.",
    "Finish the boring essential before the exciting optional.",
  ],
  Rahu:[
    "Prototype the weird idea; time-box it.",
    "Leverage trends without losing first principles.",
    "Document risk; cap the downside explicitly.",
  ],
  Ketu:[
    "Create deep-work islands—no notifications.",
    "Practice subtraction: remove one nonessential.",
    "Explore intuition in data-backed ways (notes + metrics).",
  ],
};

/** Spotlight – what to do if weak */
export const ifWeak: Record<PlanetId, string[]> = {
  Sun:[
    "Avoid ego spikes; delegate and share stage.",
    "Plan recovery windows; protect sleep.",
    "Pick one clear priority for the day.",
  ],
  Moon:[
    "Hydrate, sunlight in the morning, regular meals.",
    "Use simple routines; avoid late-night scrolling.",
    "Journal feelings → one tiny action.",
  ],
  Mars:[
    "Don’t start fights; move your body instead.",
    "Break tasks into 10–15 min sprints.",
    "Mind heat foods/stimulants if edgy.",
  ],
  Mercury:[
    "Slow down speaking; write to think.",
    "Single-thread work; limit tab chaos.",
    "Rehearse key conversations once.",
  ],
  Jupiter:[
    "Avoid over-promising; ground advice in data.",
    "Revisit ethics before expansion.",
    "Keep a gratitude log to re-prime optimism.",
  ],
  Venus:[
    "Tidy your space; reduce sensory noise.",
    "Gentle social time beats doom-scrolling.",
    "Dress/ambience as a nudge, not a rabbit hole.",
  ],
  Saturn:[
    "Scope smaller; pick the minimum viable routine.",
    "Protect joints/back; warm-ups > bravado.",
    "Track streaks; forgive breaks fast, restart.",
  ],
  Rahu:[
    "Reduce novelty binge; set experiment caps.",
    "Avoid get-rich-quick aisles.",
    "Pair each risk with a stop-loss.",
  ],
  Ketu:[
    "Don’t isolate totally; schedule humane contact.",
    "From vague ‘intuition’ to notes with hypotheses.",
    "Release one attachment kindly, not abruptly.",
  ],
};

/** Optional: tooltips for pillar bars (Gen-Z mode shows classical as hint) */
export function pillarHint(key: keyof typeof PILLAR_LABELS) {
  return PILLAR_LABELS[key].hint ?? PILLAR_LABELS[key].classical;
}

/** Share text builder */
export function buildShareText(bosses: PlanetId[], weak: PlanetId[]) {
  const b = bosses.length ? bosses.join(", ") : "—";
  const w = weak.length ? weak.join(", ") : "—";
  return `My Shadbala → Boss: ${b} | Weak: ${w}`;
}
