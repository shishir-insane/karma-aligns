// components/utils/achievements/shadbala.ts
import type { PlanetId } from "@/components/types/shadbala";

export const BOSS_THRESHOLD = 0.70;
export const WEAK_THRESHOLD = 0.40;

export type UIPlanet = { id: PlanetId; total: number };

export function isBoss(score: number) {
  return score >= BOSS_THRESHOLD;
}

export function detectPlanetAchievements(planets: UIPlanet[]) {
  const out: { key: string; planet: PlanetId; label: string; emoji: string }[] = [];

  // Boss planets
  planets
    .filter(p => p.total >= BOSS_THRESHOLD)
    .forEach(p => out.push({
      key: `boss:${p.id}`,
      planet: p.id,
      label: `Boss ${p.id}`,
      emoji: "👑",
    }));

  // Weak planets
  planets
    .filter(p => p.total < WEAK_THRESHOLD)
    .forEach(p => out.push({
      key: `weak:${p.id}`,
      planet: p.id,
      label: `Weak ${p.id}`,
      emoji: "🪫",
    }));

  // Top 1 (always, if any)
  const top = [...planets].sort((a,b) => b.total - a.total)[0];
  if (top) {
    out.push({
      key: `top:${top.id}`,
      planet: top.id,
      label: `Top: ${top.id}`,
      emoji: "⭐",
    });
  }

  return out;
}

/** Very short, planet-flavored nudge to show on the card when weak */
export function weakPlanetQuests(planets: UIPlanet[]) {
  const tips: Partial<Record<PlanetId, string>> = {};

  const defaultTip = "Start a 10-minute micro-routine aligned to its themes.";
  const pick = (arr: string[]) => arr[0] ?? defaultTip;

  planets.forEach(p => {
    if (p.total >= WEAK_THRESHOLD) return;

    const map: Record<PlanetId, string[]> = {
      Sun:     ["Plan one visible ownership task today."],
      Moon:    ["Fix sleep/wake & hydrate early."],
      Mars:    ["Do a short movement sprint; avoid conflict."],
      Mercury: ["Write first; single-thread your tabs."],
      Jupiter: ["Ground big calls in data; keep promises small."],
      Venus:   ["Tidy your space; add one comfort cue."],
      Saturn:  ["Commit to a tiny routine and track a streak."],
      Rahu:    ["Cap experiments; pair each risk with a stop-loss."],
      Ketu:    ["Subtract one nonessential; schedule humane contact."],
    };

    tips[p.id] = pick(map[p.id as PlanetId] ?? [defaultTip]);
  });

  return tips as Record<PlanetId, string>;
}