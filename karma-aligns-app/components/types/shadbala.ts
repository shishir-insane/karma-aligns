// types/shadbala.ts
export type PillarKey =
  | "sthana"     // Sthāna Bala
  | "dig"        // Dik Bala
  | "kala"       // Kāla Bala
  | "cheshta"    // Cheṣṭā Bala
  | "naisargika" // Naiṣargika Bala
  | "drik";      // Dṛk Bala

export type PlanetId =
  | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn"
  | "Rahu" | "Ketu";

export type NormalizedPillars = Partial<Record<PillarKey, number>>;

export type ExtractedPlanet = {
  id: PlanetId;
  normalized: { total: number } & NormalizedPillars;
  classical?: {
    virupa: number; // integer-ish
    rupa: number;   // decimal
    tier?: string;
    components?: {
      virupa: Partial<Record<PillarKey, number>>;
      rupa: Partial<Record<PillarKey, number>>;
    };
  };
  tags: string[];
};

export type ExtractedShadbala = {
  planets: ExtractedPlanet[];
  ranking: PlanetId[]; // sorted by normalized total desc, tie-breaker rupa
};
