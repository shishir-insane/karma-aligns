// utils/extractors/extractShadbala.ts
import { PLANETS } from "@/components/tokens/Shadbala";
import type { ExtractedShadbala, ExtractedPlanet, PlanetId, PillarKey } from "@/types/shadbala";

type Api = {
  shadbala: {
    components: {
      normalized: Record<PlanetId, Partial<Record<PillarKey, number>>>;
      virupa_rupa?: Record<PlanetId, {
        components?: {
          rupa?: Partial<Record<PillarKey, number>>;
          virupa?: Partial<Record<PillarKey, number>>;
        };
        totals?: { rupa?: number; virupa?: number };
      }>;
    };
    totals?: {
      normalized?: Record<PlanetId, number>;
      rupa?: Record<PlanetId, number>;
      virupa?: Record<PlanetId, number>;
      tier?: Record<PlanetId, string>;
    };
    summary?: {
      ranking_by_rupa?: [PlanetId, number][];
    };
  };
};

export function extractShadbala(data: Api): ExtractedShadbala {
  const comp = data?.shadbala?.components ?? { normalized: {} };
  const totals = data?.shadbala?.totals ?? {};

  const planets: ExtractedPlanet[] = PLANETS
    .filter((id) => comp.normalized?.[id]) // only those present in payload
    .map((id) => {
      const pillars = comp.normalized[id] ?? {};

      // Prefer server-provided normalized total; fallback to local avg
      const providedTotal = totals.normalized?.[id];
      const localAvg = (() => {
        const vals = Object.values(pillars).filter((v): v is number => typeof v === "number");
        return vals.length ? vals.reduce((a,b)=>a+b,0) / vals.length : 0;
      })();
      const total = typeof providedTotal === "number" ? providedTotal : localAvg;

      // Build classical if either per-planet totals exist or global totals exist
      const vr = comp.virupa_rupa?.[id];
      const classical =
        (vr?.totals?.rupa != null || vr?.totals?.virupa != null || totals.rupa?.[id] != null || totals.virupa?.[id] != null)
          ? {
              virupa: Math.round((vr?.totals?.virupa ?? totals.virupa?.[id] ?? 0) as number),
              rupa: Number(((vr?.totals?.rupa ?? totals.rupa?.[id] ?? 0) as number).toFixed(6)),
              tier: totals.tier?.[id],
              components: {
                virupa: vr?.components?.virupa ?? {},
                rupa: vr?.components?.rupa ?? {},
              },
            }
          : undefined;

      return {
        id,
        normalized: { total, ...pillars },
        classical,
        tags: [], // filled by copy layer if needed
      };
    });

  // Sort by normalized total desc, break ties by rupa desc
  const ranking = [...planets]
    .sort((a,b) =>
      (b.normalized.total - a.normalized.total) ||
      ((b.classical?.rupa ?? 0) - (a.classical?.rupa ?? 0))
    )
    .map(p => p.id);

  return { planets, ranking };
}
