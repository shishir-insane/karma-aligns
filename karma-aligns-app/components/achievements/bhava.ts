// components/utils/achievements/bhava.ts
export const BOSS_THRESHOLD = 0.70;
export const WEAK_THRESHOLD = 0.40;

export type UIHouse = { id: string; total: number }; // e.g., "1st", "2nd", ...

export function isBoss(score: number) {
  return score >= BOSS_THRESHOLD;
}

export function detectHouseAchievements(houses: UIHouse[]) {
  const out: { key: string; house: string; label: string; emoji: string }[] = [];

  houses.filter(h => h.total >= BOSS_THRESHOLD).forEach(h => {
    out.push({ key: `boss:${h.id}`, house: h.id, label: `Boss ${h.id}`, emoji: "👑" });
  });

  houses.filter(h => h.total < WEAK_THRESHOLD).forEach(h => {
    out.push({ key: `weak:${h.id}`, house: h.id, label: `Weak ${h.id}`, emoji: "🪫" });
  });

  const top = [...houses].sort((a, b) => b.total - a.total)[0];
  if (top) {
    out.push({ key: `top:${top.id}`, house: top.id, label: `Top: ${top.id}`, emoji: "⭐" });
  }
  return out;
}

/** One short nudge per weak house (used on cards, not Spotlight) */
export function weakHouseQuests(houses: UIHouse[]) {
  const tips: Record<string, string> = {};
  const defaultTip = "A 10-minute micro-habit aligned to this house helps.";

  const map: Record<string, string[]> = {
    "1st": ["Do one vitality boost (walk/sunlight)."],
    "2nd": ["Track one spend; tidy money inbox."],
    "3rd": ["Send one brave message; small repetition."],
    "4th": ["Clean one corner; early wind-down."],
    "5th": ["10 min creative play; share 1 output."],
    "6th": ["One boring essential; tick it off."],
    "7th": ["Repair a thread; make one ask."],
    "8th": ["Document one risk; simplify one thing."],
    "9th": ["Read 10 mins; write one note."],
    "10th": ["Ship something visible; tiny scope."],
    "11th": ["Ping a collaborator; small loop."],
    "12th": ["Schedule quiet; subtract one distraction."],
  };

  houses.forEach(h => {
    if (h.total < WEAK_THRESHOLD) {
      tips[h.id] = (map[h.id]?.[0] ?? defaultTip);
    }
  });

  return tips;
}
