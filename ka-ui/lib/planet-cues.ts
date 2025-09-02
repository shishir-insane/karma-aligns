// lib/planet-cues.ts
export type PlanetCue = {
    name: string
    positive: string
    caution: string
  }
  
  export const PLANET_CUES: PlanetCue[] = [
    {
      name: "Sun",
      positive: "Visibility, confidence, leadership, life-force",
      caution: "Ego clashes, burnout if overexposed",
    },
    {
      name: "Moon",
      positive: "Belonging, care, intuition, emotional attunement",
      caution: "Mood swings, over-identifying with comfort",
    },
    {
      name: "Mercury",
      positive: "Communication, trade, learning, short trips, networks",
      caution: "Mental scatter, overthinking, gossip/noise",
    },
    {
      name: "Venus",
      positive: "Relationships, harmony, aesthetics, money flow",
      caution: "Indulgence, people-pleasing, value trade-offs",
    },
    {
      name: "Mars",
      positive: "Drive, courage, competition, decisive action",
      caution: "Conflict, accidents, impatience—channel into sport/work",
    },
    {
      name: "Jupiter",
      positive: "Growth, luck, teachers/mentors, expansion",
      caution: "Overreach, excess, promises larger than delivery",
    },
    {
      name: "Saturn",
      positive: "Discipline, mastery, long-term building, resilience",
      caution: "Delays, heaviness, strict responsibilities",
    },
    {
      name: "Uranus",
      positive: "Freedom, innovation, breakthrough friends/ideas",
      caution: "Instability, sudden changes, restlessness",
    },
    {
      name: "Neptune",
      positive: "Inspiration, artistry, spirituality, compassion",
      caution: "Confusion, escapism, unclear boundaries",
    },
    {
      name: "Pluto",
      positive: "Deep transformation, power, truth-seeking",
      caution: "Power struggles, intensity, control issues",
    },
    {
      name: "Rahu",
      positive: "Ambition, worldly gains, novel paths, visibility",
      caution: "Obsessions, shortcuts, reputational swings",
    },
  ]
  