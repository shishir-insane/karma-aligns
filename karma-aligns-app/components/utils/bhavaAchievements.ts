import { bucket } from "@/components/tokens/scales";

export type UiHouse = { id: number; total: number; };
export type Achievement =
  | { key:"boss-house"; house:number; label:string; emoji:string }
  | { key:"balanced-1-7"; label:string; emoji:string };

export function detectAchievements(houses: UiHouse[]): Achievement[] {
  const out: Achievement[] = [];
  const top = [...houses].sort((a,b)=>b.total-a.total)[0];
  if (bucket(top.total) === "boss") {
    out.push({ key:"boss-house", house: top.id, label:`Unlocked Boss House ${top.id} — Career Glow-Up`, emoji:"👑" });
  }
  const h1 = houses.find(h=>h.id===1)?.total ?? 0;
  const h7 = houses.find(h=>h.id===7)?.total ?? 0;
  if (Math.abs(h1 - h7) <= 0.02) {
    out.push({ key:"balanced-1-7", label:"Balanced Axis 1↔7 — Relationship Harmony", emoji:"🌸" });
  }
  return out;
}

export function weakHouseQuests(houses: UiHouse[]) {
  // Mini-quests for weak houses
  return houses
    .filter(h => h.total < 0.40)
    .slice(0,3)
    .map(h => ({ house: h.id, tip: h.id===6 ? "House 6 weak → one tiny health action today." :
                           h.id===12 ? "House 12 weak → schedule 20 min quiet time." :
                           "Pick one low-effort task to support this area today." }));
}
