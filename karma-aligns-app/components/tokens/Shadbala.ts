// tokens/Shadbala.ts
import type { PlanetId, PillarKey } from "@/types/shadbala";

export const PLANETS: PlanetId[] = [
  "Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"
];

export const PLANET_THEMES: Record<PlanetId, string[]> = {
  Sun:["leadership","vitality","ego","authority"],
  Moon:["mood","care","rhythm","memory"],
  Mars:["courage","drive","initiative","defense"],
  Mercury:["logic","communication","trade","analysis"],
  Jupiter:["wisdom","growth","ethics","teaching"],
  Venus:["love","aesthetics","comfort","social"],
  Saturn:["discipline","time","structure","duty"],
  Rahu:["innovation","edge","unconventional","hype"],
  Ketu:["detachment","intuition","mysticism","release"],
};

export const PLANET_STICKERS: Record<PlanetId, { emoji: string; label: string; tone?: "emerald"|"violet"|"rose"|"amber" }> = {
  Sun:{ emoji:"☀️", label:"center stage", tone:"emerald" },
  Moon:{ emoji:"🌙", label:"soft power", tone:"violet" },
  Mars:{ emoji:"🔥", label:"action hero", tone:"amber" },
  Mercury:{ emoji:"🧠", label:"big brain", tone:"violet" },
  Jupiter:{ emoji:"🍀", label:"lucky growth", tone:"emerald" },
  Venus:{ emoji:"💞", label:"aesthetic main", tone:"emerald" },
  Saturn:{ emoji:"⏳", label:"discipline buff", tone:"violet" },
  Rahu:{ emoji:"☊", label:"edge seeker", tone:"amber" },
  Ketu:{ emoji:"☋", label:"inner compass", tone:"violet" },
};

export const PILLAR_LABELS: Record<PillarKey, { genz: string; classical: string; hint?: string }> = {
  sthana:     { genz:"Positional", classical:"Sthāna Bala",    hint:"Sign/house placement, uccha/neecha mix" },
  dig:        { genz:"Direction",  classical:"Dik Bala",       hint:"Angular strength by natural direction" },
  kala:       { genz:"Time",       classical:"Kāla Bala",      hint:"Diurnal/nocturnal, tithi, hora, etc." },
  cheshta:    { genz:"Motion",     classical:"Cheṣṭā Bala",    hint:"Speed/phase like retro/fast/slow" },
  naisargika: { genz:"Innate",     classical:"Naiṣargika Bala",hint:"Inherent (planet-specific) baseline" },
  drik:       { genz:"Aspects",    classical:"Dṛk Bala",       hint:"Aspectual support vs affliction" },
};
