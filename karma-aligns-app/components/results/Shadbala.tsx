'use client';

import { useEffect, useMemo, useRef, useState } from "react";

/* =========================================================
   Types / Constants
========================================================= */
type NormLike = {
  shadbala?: Array<{ pillar?: string; name?: string; key?: string; value?: number; score?: number }>;
};

type PillarKey = "sthana" | "dig" | "kala" | "cheshta" | "naisargika" | "drik";
const PILLAR_ORDER: PillarKey[] = ["sthana", "dig", "kala", "cheshta", "naisargika", "drik"];

const PILLAR_META: Record<PillarKey, {
  emoji: string;
  title: string;
  hint: string;
  story: (v:number)=>string;
  sname: string;
  sdesc: string;
}> = {
  sthana:     { emoji: "🏛️", title: "Placement Power",   hint: "Sign/house context. Feels ‘at home’ = smoother vibes.", sname:"Sthāna Bala", sdesc:"Strength from sign & house dignity (exaltation, own sign, etc.).", story: v => v>=0.7? "Placed like a VIP—flows naturally." : v>=0.55? "Decent footing." : v>=0.4? "Not comfy; needs context." : "Out of place; tread soft." },
  dig:        { emoji: "🧭", title: "Directional Power",  hint: "Angles/visibility. Shows up where people notice.",     sname:"Dig Bala",    sdesc:"Strength by direction/angles (Asc/MC etc.).",              story: v => v>=0.7? "Front-row presence." : v>=0.55? "Can get seen when needed." : v>=0.4? "Low stage time." : "Backstage; not visible." },
  kala:       { emoji: "⏱️", title: "Timing Power",       hint: "Day/night, tithi & time factors.",                      sname:"Kāla Bala",   sdesc:"Strength from time conditions (day/night, lunar day).",   story: v => v>=0.7? "Perfect timing vibes." : v>=0.55? "Okay timing." : v>=0.4? "Off-timed." : "Wrong time, wrong place." },
  cheshta:    { emoji: "⚡", title: "Drive / Motion",      hint: "Speed/retro dynamics = go vs slow.",                    sname:"Cheṣṭā Bala", sdesc:"Strength from apparent motion (speed, retrograde).",     story: v => v>=0.7? "Go-mode." : v>=0.55? "Can push through." : v>=0.4? "Low momentum." : "Sleepy—don’t force it." },
  naisargika: { emoji: "🌟", title: "Natural Power",       hint: "Planet’s innate oomph.",                                sname:"Naisargika",  sdesc:"Innate, natural strength of each graha.",                story: v => v>=0.7? "Built different." : v>=0.55? "Solid baseline." : v>=0.4? "Mild baseline." : "Minimal power." },
  drik:       { emoji: "🪞", title: "Aspect Weather",      hint: "Benefic boosts vs malefic friction.",                   sname:"Drik Bala",   sdesc:"Strength from aspects received (support vs affliction).", story: v => v>=0.7? "Supportive crew." : v>=0.55? "Mixed but fine." : v>=0.4? "Frictions present." : "Crowded by haters." },
};

const PLANET_EMOJI: Record<string, string> = {
  Sun: "☀️", Moon: "🌙", Mercury: "☿️", Venus: "♀️", Mars: "♂️",
  Jupiter: "♃", Saturn: "♄", Rahu: "☊", Ketu: "☋"
};
const PLANET_ORDER = ["Sun","Moon","Mercury","Venus","Mars","Jupiter","Saturn","Rahu","Ketu"];

/* =========================================================
   Helpers / Scales
========================================================= */

/* Absolute scale (adds isBoss) */
function badgeAbsolute(value: number) {
  const v = clamp01(value);
  if (v >= 0.70) return {
    text: "Very strong • Boss Mode",
    cls: "border-emerald-400/25 bg-emerald-300/10 text-emerald-300",
    isBoss: true
  };
  if (v >= 0.55) return {
    text: "Average to good • Holding Steady",
    cls: "border-violet-400/25 bg-violet-300/10 text-violet-300",
    isBoss: false
  };
  if (v >= 0.40) return {
    text: "Weak • Needs a Boost",
    cls: "border-amber-400/25 bg-amber-300/10 text-amber-300",
    isBoss: false
  };
  return {
    text: "Very weak • Needs Support",
    cls: "border-rose-400/25 bg-rose-300/10 text-rose-300",
    isBoss: false
  };
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const fmt1 = (n: number) => (isFinite(n) ? n.toFixed(2) : "—");
const fmt0 = (n: number) => (isFinite(n) ? Math.round(n).toString() : "—");
const titleCase = (s: string) =>
  (s || "")
    .replace(/[_\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function levelFromValue(v: number) {
  const n = clamp01(v);
  if (n >= 0.85) return 5;
  if (n >= 0.70) return 4;
  if (n >= 0.55) return 3;
  if (n >= 0.40) return 2;
  return 1;
}

function useInView<T extends HTMLElement>(opts?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), opts ?? { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [opts]);
  return { ref, inView };
}

/* One-time nudge pill */
function useOneTimeNudge(key: string) {
  const [show, setShow] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(key) !== "1";
  });
  const dismiss = () => {
    setShow(false);
    if (typeof window !== "undefined") window.localStorage.setItem(key, "1");
  };
  return { show, dismiss };
}

/* =========================================================
   Data Extraction (supports NEW + OLD)
========================================================= */
function extractShadbala(data?: any, norm?: NormLike) {
  const raw = data?.shadbala ?? data?.shad_bala ?? null;

  let components: Record<string, Partial<Record<PillarKey, number>>> | null = null;
  let totals: Record<string, number> | null = null;

  // classical (optional) maps
  let classicalComponents: Record<string, Partial<Record<PillarKey, { rupa?: number; virupa?: number }>>> = {};
  let classicalTotals: Record<string, { rupa?: number; virupa?: number }> = {};

  // NEW normalized
  const newComp = raw?.components?.normalized;
  const newTotals = raw?.totals?.normalized;

  if (newComp && typeof newComp === "object") {
    components = {};
    for (const [planet, pillars] of Object.entries(newComp as Record<string, any>)) {
      const entry: Partial<Record<PillarKey, number>> = {};
      for (const k of PILLAR_ORDER) {
        const v = Number((pillars as any)[k]);
        if (!isNaN(v)) entry[k] = clamp01(v);
      }
      components[planet] = entry;
    }
  }

  if (newTotals && typeof newTotals === "object") {
    totals = {};
    for (const [planet, v] of Object.entries(newTotals as Record<string, any>)) {
      const n = Number(v);
      if (!isNaN(n)) totals[planet] = clamp01(n);
    }
  }

  // Classical virupa/rupa (optional)
  const vr = raw?.components?.virupa_rupa;
  if (vr && typeof vr === "object") {
    for (const [planet, block] of Object.entries(vr as Record<string, any>)) {
      const comp = (block as any)?.components ?? {};
      const rupa = comp?.rupa ?? {};
      const virupa = comp?.virupa ?? {};
      const entry: Partial<Record<PillarKey, { rupa?: number; virupa?: number }>> = {};
      for (const k of PILLAR_ORDER) {
        const r = Number(rupa?.[k]);
        const v = Number(virupa?.[k]);
        entry[k] = {
          ...(isFinite(r) ? { rupa: r } : {}),
          ...(isFinite(v) ? { virupa: v } : {}),
        };
      }
      classicalComponents[planet] = entry;

      const totalsBlock = (block as any)?.totals ?? {};
      const tr = Number(totalsBlock?.rupa);
      const tv = Number(totalsBlock?.virupa);
      classicalTotals[planet] = {
        ...(isFinite(tr) ? { rupa: tr } : {}),
        ...(isFinite(tv) ? { virupa: tv } : {}),
      };
    }
  }

  // OLD shape fallback
  if (!components && raw?.components && typeof raw.components === "object") {
    components = {};
    for (const [planet, pillars] of Object.entries(raw.components as Record<string, any>)) {
      const entry: Partial<Record<PillarKey, number>> = {};
      for (const k of PILLAR_ORDER) {
        const v = Number((pillars as any)[k]);
        if (!isNaN(v)) entry[k] = clamp01(v);
      }
      components[planet] = entry;
    }
  }

  if (!totals && raw?.total && typeof raw.total === "object") {
    totals = {};
    for (const [planet, v] of Object.entries(raw.total as Record<string, any>)) {
      const n = Number(v);
      if (!isNaN(n)) totals[planet] = clamp01(n);
    }
  }

  // Fallback when per-planet not present: use normalized array from `norm`
  let pillarSummary: Array<{ key: PillarKey; label: string; value: number }> = [];
  if (!components && Array.isArray(norm?.shadbala) && norm!.shadbala!.length) {
    pillarSummary = norm!.shadbala!.map((x: any) => {
      const k = String(x?.pillar ?? x?.name ?? x?.key ?? "").toLowerCase();
      const key: PillarKey =
        (k.includes("sthana") && "sthana") ||
        (k.includes("dig") && "dig") ||
        (k.includes("kala") && "kala") ||
        ((k.includes("chesh") || k.includes("ches")) && "cheshta") ||
        (k.includes("nais") && "naisargika") ||
        ((k.includes("drik") || k.includes("drig")) && "drik") ||
        "sthana";
      return { key, label: titleCase(k), value: clamp01(Number(x?.value ?? x?.score ?? 0)) };
    });
  }

  return { components, totals, pillarSummary, classicalComponents, classicalTotals };
}

/* =========================================================
   Visuals
========================================================= */
function RadarChart({ values, size = 160 }: { values: number[]; size?: number }) {
  const pad = 18;
  const cx = size / 2, cy = size / 2;
  const rMax = (size / 2) - pad;
  const N = PILLAR_ORDER.length;

  const points = values.map((v, i) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const r = rMax * clamp01(v);
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");

  return (
    <svg width={size} height={size} className="mx-auto block">
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <circle key={t} cx={cx} cy={cy} r={rMax * t} className="fill-none stroke-white/10" />
      ))}
      {Array.from({ length: N }, (_, i) => {
        const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
        const x = cx + rMax * Math.cos(angle);
        const y = cy + rMax * Math.sin(angle);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="stroke-white/10" />;
      })}
      <polygon
        points={points}
        className="fill-fuchsia-500/25 stroke-violet-400/70"
        style={{ filter: "drop-shadow(0 6px 18px rgba(167,139,250,.25))" }}
      />
    </svg>
  );
}

function useClickAway<T extends HTMLElement>(onAway: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onAway();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onAway]);
  return ref;
}

/* What-if copy */
const WHAT_IF: Record<string, { strong: string; weak: string; areas: string[] }> = {
  Sun:     { strong: "Leadership glow, clarity, recognition.", weak: "Low vitality; ego feels tender.", areas: ["Career", "Confidence", "Visibility"] },
  Moon:    { strong: "Emotional balance, good sleep/intuition.", weak: "Mood swings, low hydration/energy.", areas: ["Emotions", "Home", "Habits"] },
  Mercury: { strong: "Sharp mind, fast learning, witty comms.", weak: "Scatter, overthinking, mixed signals.", areas: ["Study", "Communication", "Commerce"] },
  Venus:   { strong: "Romance blooms, social charm, style glow.", weak: "Meh in romance, impulse buys.", areas: ["Relationships", "Aesthetics", "Money"] },
  Mars:    { strong: "Drive, courage, competitive fire.", weak: "Irritation, wasted effort, burnout risk.", areas: ["Action", "Discipline", "Sport"] },
  Jupiter: { strong: "Mentors, luck, growth mindset.", weak: "Overexpansion or doubt in purpose.", areas: ["Wisdom", "Wealth", "Beliefs"] },
  Saturn:  { strong: "Discipline, systems, long-game wins.", weak: "Delay fatigue; fear of failure.", areas: ["Work Ethic", "Boundaries", "Time"] },
  Rahu:    { strong: "Bold experiments, viral opportunities.", weak: "Chaos, shortcuts, clout-chasing.", areas: ["Innovation", "Media", "Ambition"] },
  Ketu:    { strong: "Detachment superpower, deep focus.", weak: "Ghosting energy, isolation.", areas: ["Focus", "Spirituality", "Minimalism"] },
};

/* =========================================================
   UI Bits
========================================================= */
function PillarRow({
  planet,
  k,
  v,
  classical,
  showClassic,
  openTipId,
  setOpenTipId
}: {
  planet: string;
  k: PillarKey;
  v: number;
  classical?: { rupa?: number; virupa?: number };
  showClassic: boolean;
  openTipId: string | null;
  setOpenTipId: (id: string | null) => void;
}) {
  const meta = PILLAR_META[k];
  const b = badgeAbsolute(v);
  const id = `${planet}:${k}`;
  const open = openTipId === id;
  const ref = useClickAway<HTMLDivElement>(() => {
    if (openTipId === id) setOpenTipId(null);
  });

  return (
    <div className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
      <div className="text-base leading-none">{meta.emoji}</div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-medium flex items-center gap-2">
            {meta.title}
            <div ref={ref} className="relative inline-block">
              <button
                type="button"
                onClick={() => setOpenTipId(open ? null : id)}
                className="h-5 w-5 rounded-full border border-white/20 text-[11px] leading-5 text-white/80 hover:bg-white/10"
                aria-expanded={open}
                aria-label={`Explain ${meta.sname}`}
              >?</button>
              {open && (
                <div className="absolute z-30 mt-2 w-64 rounded-xl border border-white/10 bg-[#0e1224] p-3 text-xs leading-relaxed text-white/85 shadow-2xl">
                  <div className="font-semibold mb-1">{meta.sname}</div>
                  <p className="text-white/80">{meta.sdesc}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <div className={`text-[10px] px-2 py-0.5 rounded-full border ${b.cls} whitespace-normal leading-tight text-center`}>
              {b.text}
            </div>
            <div className="text-xs text-white/70 ml-auto sm:ml-0">{fmt1(v)}</div>
            {v >= 0.70 && (
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-400/25 bg-emerald-300/10 text-emerald-300">
                👑 Boss pillar
              </span>
            )}
          </div>
        </div>

        <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-violet-500 transition-[width] duration-700 ease-out"
            style={{ width: `${clamp01(v) * 100}%` }}
          />
        </div>

        <div className="mt-1.5 text-[11px] leading-relaxed text-white/70">
          {meta.hint} <span className="text-white/60">({meta.story(v)})</span>
          {showClassic && (classical?.rupa != null || classical?.virupa != null) && (
            <span className="ml-2 text-white/50">
              — <span className="italic">{fmt1(classical?.rupa ?? NaN)} rūpa</span>
              {" "}<span className="opacity-70">•</span>{" "}
              <span className="italic">{fmt0(classical?.virupa ?? NaN)} virūpa</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function StrengthRing({ value, pulseOnStrong = true, charged = true }: { value: number; pulseOnStrong?: boolean; charged?: boolean }) {
  const v = clamp01(value);
  const deg = Math.round(v * 360);
  const inset = Math.max(6, 14 - Math.round(v * 10));
  const pulse = pulseOnStrong && v >= 0.7 ? 'animate-pulse' : '';
  return (
    <div className={`relative w-24 h-24 ${pulse}`}>
      <div
        className={`absolute inset-0 rounded-full ${charged ? "" : "opacity-40"} ${v >= 0.70 ? "shadow-[0_0_30px_rgba(16,185,129,.35)]" : ""}`}
        style={{ backgroundImage: `conic-gradient(#a78bfa ${deg}deg, rgba(255,255,255,0.06) ${deg}deg)` }}
      />
      <div className="absolute inset-0 rounded-full bg-black/10 blur-md" />
      <div className="absolute rounded-full bg-white/5 border border-white/10 flex items-center justify-center" style={{ inset }}>
        <div className="text-sm font-semibold">{fmt1(v)}</div>
      </div>
    </div>
  );
}

/* Spotlight modal */
function SpotlightModal({
  open,
  onClose,
  planet,
  value,
  classical,
}: {
  open: boolean;
  onClose: () => void;
  planet: string;
  value: number;
  classical?: { rupa?: number; virupa?: number };
}) {
  if (!open) return null;
  const info = WHAT_IF[planet] ?? { strong: "", weak: "", areas: [] };
  const lvl = levelFromValue(value);
  const b = badgeAbsolute(value);
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-[71] w-full sm:max-w-md sm:rounded-2xl sm:border sm:border-white/10 bg-gradient-to-b from-indigo-950/80 to-black p-5 sm:p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{PLANET_EMOJI[planet] ?? "✨"}</div>
            <div>
              <div className="text-xl font-semibold">{planet}</div>
              <div className="text-xs text-white/60">Level {lvl}/5 • <span className={`px-1.5 py-0.5 rounded-full border ${b.cls} text-[10px]`}>{b.text}</span></div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-white/10">Close</button>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <StrengthRing value={value} />
        </div>

        {info.areas.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {info.areas.map((a, i) => (
              <span key={i} className="px-2.5 py-1 rounded-xl bg-white/10 border border-white/10 text-xs">{a}</span>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm space-y-2">
          <div className="text-xs uppercase tracking-wide text-white/60">What if?</div>
          <div><span className="font-semibold">Strong {planet}:</span> {info.strong}</div>
          <div><span className="font-semibold">Weak {planet}:</span> {info.weak}</div>
          {classical && (classical.rupa != null || classical.virupa != null) && (
            <div className="text-[12px] text-white/60 pt-1">
              Classical total: {classical.rupa != null ? `${fmt1(classical.rupa)} Rūpas` : ""} {classical.virupa != null ? `(${fmt0(classical.virupa)} Virūpas)` : ""}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Planet card (with Boss Mode & nudge) */
function PlanetCard({
  name,
  pillars,
  total,
  classicalPlanet,
  showClassic,
  openTipId,
  setOpenTipId,
  onOpenSpotlight
}: {
  name: string;
  pillars: Partial<Record<PillarKey, number>>;
  total?: number;
  classicalPlanet?: { totals?: { rupa?: number; virupa?: number }, comps?: Partial<Record<PillarKey, { rupa?: number; virupa?: number }>> };
  showClassic: boolean;
  openTipId: string | null;
  setOpenTipId: (id: string | null) => void;
  onOpenSpotlight: (planet: string, value: number, classical?: { rupa?: number; virupa?: number }) => void;
}) {
  const [open, setOpen] = useState(false);
  const totalSafe = clamp01(total ?? 0);
  const b = badgeAbsolute(totalSafe);
  const isBoss = !!(b as any).isBoss;
  const valuesInOrder = PILLAR_ORDER.map(k => pillars[k] ?? 0);
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });
  const { show: showNudge, dismiss: dismissNudge } = useOneTimeNudge("ka:shadbala:spotlight:nudge");

  const totalStory =
    totalSafe >= 0.7 ? `${name} is in boss mode — expect noticeable results.`
    : totalSafe >= 0.55 ? `${name} has presence — can deliver when you show up.`
    : totalSafe >= 0.4 ? `${name} is muted — manage expectations here.`
    : `${name} is low impact rn — don’t overindex decisions here.`;

  const totR = classicalPlanet?.totals?.rupa;
  const totV = classicalPlanet?.totals?.virupa;

  return (
    <div
      ref={ref}
      className={
        "snap-center group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all " +
        (isBoss
          ? "ring-1 ring-emerald-400/30 shadow-[0_0_32px_rgba(16,185,129,.25)] hover:bg-white/8"
          : "hover:bg-white/8 hover:shadow-[0_10px_30px_rgba(147,51,234,.25)]"
        )
      }
    >
      <div className="flex items-start justify-between gap-3">
        <button
          onClick={() => { onOpenSpotlight(name, totalSafe, classicalPlanet?.totals); dismissNudge(); }}
          className="group/planet flex items-center gap-3 rounded-xl px-1 py-1
                     cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60
                     hover:bg-white/5 transition-colors"
          aria-label={`Open ${name} Spotlight`}
          title="Open Spotlight"
        >
          <div className="text-2xl transition-transform group-hover/planet:scale-[1.05]">{PLANET_EMOJI[name] ?? "✨"}</div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <div className="text-base font-semibold underline decoration-transparent group-hover/planet:decoration-white/40">
                {name}
              </div>
              {isBoss && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full
                                 border border-emerald-400/25 bg-emerald-300/10 text-emerald-300">
                  👑 Boss Mode
                </span>
              )}
              <span className="text-xs text-white/50 translate-y-[1px] transition-transform group-hover/planet:translate-x-0.5">↗</span>
            </div>
            <div className="text-[11px] text-white/60">Shadbala total • Level {levelFromValue(totalSafe)}/5</div>

            {/* {showNudge && (
              <div className="mt-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5
                              rounded-full border border-white/10 bg-white/5 text-white/70
                              animate-[pulse_2.0s_ease-in-out_infinite]">
                <span className="opacity-80">Tap for Spotlight</span>
                <span className="opacity-70">↗</span>
              </div>
            )} */}
          </div>
        </button>

        <div className={`text-[11px] px-2 py-0.5 rounded-full border ${b.cls}`}>{b.text}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center justify-center">
          <StrengthRing value={totalSafe} charged={inView} />
        </div>
        <div className="flex items-center justify-center">
          <RadarChart values={valuesInOrder} size={160} />
        </div>
      </div>

      <p className="mt-3 text-[13px] text-white/80">
        {totalStory}
        {showClassic && (totR != null || totV != null) && (
          <span className="block text-[12px] text-white/60 mt-1">
            Classical: <span className="italic">{fmt1(totR ?? NaN)} Rūpas</span> (<span className="italic">{fmt0(totV ?? NaN)} Virūpas</span>)
          </span>
        )}
      </p>

      <button
        onClick={() => setOpen(o => !o)}
        className="mt-3 text-xs rounded-xl border border-white/10 px-3 py-1.5 hover:bg-white/5"
        aria-expanded={open}
      >
        {open ? "Hide breakdown" : "View breakdown"}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/3 p-2">
          {PILLAR_ORDER.map((k) =>
            pillars[k] != null ? (
              <PillarRow
                key={k}
                planet={name}
                k={k}
                v={pillars[k]!}
                classical={classicalPlanet?.comps?.[k]}
                showClassic={showClassic}
                openTipId={openTipId}
                setOpenTipId={setOpenTipId}
              />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}

/* Inline FAQ */
function InlineFAQ() {
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="font-semibold mb-1">What is Shadbala?</div>
        <p className="text-white/75">
          Six power sources for every planet: Placement, Direction, Timing, Drive, Natural, Aspects.
          It’s a <em>planet power meter</em>.
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="font-semibold mb-1">How is total made?</div>
        <p className="text-white/75">
          Karma Aligns engine normalizes each pillar to 0–1 and blends them (often weighted). 
          It uses <strong>Lahiri ayanamsa</strong> from the <strong>Swiss Ephemeris</strong> for all calculations.
          Exact math can vary by tradition.
        </p>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="font-semibold mb-1">Reading the badge</div>
        <ul className="text-white/75 space-y-1">
          <li><span className="font-medium">0.70–1.00</span> → Very strong</li>
          <li><span className="font-medium">0.55–0.70</span> → Average to good</li>
          <li><span className="font-medium">0.40–0.55</span> → Weak</li>
          <li><span className="font-medium">&lt; 0.40</span> → Very weak</li>
        </ul>
      </div>
    </div>
  );
}

/* =========================================================
   Comparisons as Stories (with Boss highlight + dynamic tip)
========================================================= */
function ComparisonsStories({ totals }: { totals?: Record<string, number> | null }) {
  const entries = useMemo(() => {
    if (!totals) return [];
    return Object.entries(totals)
      .map(([p, v]) => [p, clamp01(Number(v))] as [string, number])
      .filter(([, v]) => isFinite(v));
  }, [totals]);

  const items = useMemo(() => {
    if (!entries.length) return [];
    const map = Object.fromEntries(entries);
    const stories: { text: string }[] = [];

    if (map.Moon != null && map.Sun != null) {
      const moon = map.Moon, sun = map.Sun;
      const stronger = moon > sun ? "Moon" : moon < sun ? "Sun" : "Tie";
      const arrow = moon > sun ? "feelings > ego" : moon < sun ? "ego > feelings" : "feelings = ego";
      if (stronger !== "Tie") {
        stories.push({ text: `Your ${stronger === "Moon" ? `Moon (${fmt1(moon)}) is stronger than your Sun (${fmt1(sun)}). Right now, ${arrow}.` : `Your Sun (${fmt1(sun)}) is stronger than your Moon (${fmt1(moon)}). Right now, ${arrow}.`}` });
      } else {
        stories.push({ text: `Your Sun and Moon are balanced at ~${fmt1(sun)} → ego ≈ feelings.` });
      }
    }

    const sorted = [...entries].sort((a,b)=>b[1]-a[1]);
    if (sorted.length >= 2) {
      const [p1, v1] = sorted[0];
      const [p2, v2] = sorted[1];
      stories.push({ text: `${p1} (${fmt1(v1)}) dominates over ${p2} (${fmt1(v2)}) → ${p1} themes lead.` });
    }
    if (sorted.length >= 3) {
      const [p1, v1] = sorted[0];
      const [p3, v3] = sorted[2];
      stories.push({ text: `${p1} (${fmt1(v1)}) also outpaces ${p3} (${fmt1(v3)}).` });
    }

    return stories.slice(0, 3);
  }, [entries]);

  const tip = useMemo(() => {
    if (!entries.length) return null;
    const strong = entries.filter(([,v]) => v >= 0.70).map(([p]) => p);
    const weak = entries.filter(([,v]) => v >= 0.40 && v < 0.55).map(([p]) => p);
    const veryWeak = entries.filter(([,v]) => v < 0.40).map(([p]) => p);
    const sorted = [...entries].sort((a,b)=>b[1]-a[1]);
    const [topP, topV] = sorted[0];

    if (strong.length >= 3) return `Power cluster: ${strong.slice(0,3).join(", ")} — you’re in “Boss Mode” across multiple areas.`;
    if (veryWeak.length >= 2) return `Tender zones: ${veryWeak.join(", ")} — try not to over-index decisions here this cycle.`;
    if (topP === "Saturn" && topV >= 0.70) return `Discipline arc unlocked — strong Saturn (${fmt1(topV)}) favors systems and long-game wins.`;
    if (topP === "Jupiter" && topV >= 0.70) return `Mentor luck online — strong Jupiter (${fmt1(topV)}) boosts learning and guidance.`;
    if (topP === "Venus" && topV >= 0.70) return `Charm magnet — strong Venus (${fmt1(topV)}) lifts relationships and style.`;
    if (topP === "Mars" && topV >= 0.70) return `Go-mode energy — strong Mars (${fmt1(topV)}) rewards action and courage.`;
    if (topP === "Moon" && topV >= 0.70) return `Mood-led momentum — strong Moon (${fmt1(topV)}) makes rest and intuition pay off.`;
    if (weak.length) return `Mixed signal phase — a few planets are warming up (${weak.join(", ")}). Keep it light, iterate.`;

    return `Spotlight on ${topP} (${fmt1(topV)}) — lean into its themes for smoother wins.`;
  }, [entries]);

  if (!items.length) return null;

  const sorted = [...entries].sort((a,b)=>b[1]-a[1]);
  const [topP, topV] = sorted[0] ?? ["", 0];
  const boss = topV >= 0.70 ? topP : null;

  return (
    <div className="mt-5 -mx-4 px-4">
      <div className="text-sm font-semibold mb-2">Quick Reads</div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {items.map((s, i) => (
          <div
            key={i}
            className="snap-center min-w-[85%] sm:min-w-[360px] rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-500/10 border border-white/10 p-4 shadow-[0_10px_30px_rgba(147,51,234,.25)]"
          >
            <div className="text-[13px] leading-relaxed">{s.text}</div>
            <div className="mt-2 text-[11px] text-white/60">
              {boss ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                                 border border-emerald-400/25 bg-emerald-300/10 text-emerald-300">
                  👑 {boss} is in Boss Mode
                </span>
              ) : (
                tip || "Quick perspective from your current strengths."
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   Compare Panel
========================================================= */
function ComparePanel({
  planets,
  components,
  totals
}: {
  planets: string[];
  components: Record<string, Partial<Record<PillarKey, number>>>;
  totals?: Record<string, number> | null;
}) {
  const [a, setA] = useState(planets[0] ?? "");
  const [b, setB] = useState(planets[1] ?? planets[0] ?? "");

  const ta = clamp01(totals?.[a] ?? 0);
  const tb = clamp01(totals?.[b] ?? 0);
  const delta = (ta - tb);

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="font-semibold">Comparison Mode</div>
          <div className="text-xs text-white/70">Spot what’s louder right now — totals & pillars.</div>
        </div>
        <div className="flex gap-3">
          <select value={a} onChange={e=>setA(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm">
            {planets.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={b} onChange={e=>setB(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm">
            {planets.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* A */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{PLANET_EMOJI[a] ?? "✨"}</span>
            <div className="font-semibold">{a}</div>
          </div>
          <div className="mt-2 text-sm">Total: <span className="font-semibold">{fmt1(ta)}</span></div>
          <div className="mt-2 space-y-1">
            {PILLAR_ORDER.map(k=>{
              const v = components[a]?.[k] ?? 0;
              return (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-28 text-white/70">{PILLAR_META[k].title}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-400 to-violet-500" style={{ width: `${clamp01(v)*100}%` }} />
                  </div>
                  <span className="w-10 text-right">{fmt1(v)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* center delta */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-3 text-center">
          <div className="text-xs text-white/70">Who’s louder?</div>
          <div className={`text-lg font-semibold ${delta>0?'text-emerald-300':delta<0?'text-rose-300':'text-white/80'}`}>
            {delta>0 ? a : delta<0 ? b : "Tie"}
          </div>
          <div className="text-xs text-white/70 mt-1">Δ total: {fmt1(Math.abs(delta))}</div>
        </div>

        {/* B */}
        <div className="rounded-xl border border-white/10 bg-white/3 p-3">
          <div className="flex items-center gap-2 justify-end">
            <div className="font-semibold">{b}</div>
            <span className="text-xl">{PLANET_EMOJI[b] ?? "✨"}</span>
          </div>
          <div className="mt-2 text-sm text-right">Total: <span className="font-semibold">{fmt1(tb)}</span></div>
          <div className="mt-2 space-y-1">
            {PILLAR_ORDER.map(k=>{
              const v = components[b]?.[k] ?? 0;
              return (
                <div key={k} className="flex items-center gap-2 text-xs">
                  <span className="w-10 text-left">{fmt1(v)}</span>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-400 to-violet-500" style={{ width: `${clamp01(v) * 100}%` }} />
                  </div>
                  <span className="w-28 text-white/70 text-right">{PILLAR_META[k].title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 text-[12px] text-white/70">
        Tip: compare your <span className="text-white/90">Moon vs Sun</span> to feel whether moods (Moon) or ego/drive (Sun) is leading right now.
      </div>
    </div>
  );
}

/* =========================================================
   Collapsible + toggles
========================================================= */
function usePersistentToggle(key: string, initial = true) {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return initial;
    const v = window.localStorage.getItem(key);
    return v == null ? initial : v === "1";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, open ? "1" : "0");
    }
  }, [key, open]);
  return { open, setOpen };
}

function usePersistentFlag(key: string, initial = false) {
  const [flag, setFlag] = useState<boolean>(() => {
    if (typeof window === "undefined") return initial;
    const v = window.localStorage.getItem(key);
    return v == null ? initial : v === "1";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, flag ? "1" : "0");
    }
  }, [key, flag]);
  return { flag, setFlag };
}

function Collapsible({ open, children }: { open: boolean; children: React.ReactNode; }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [h, setH] = useState<number | "auto">(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setH(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div
      className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${open ? "opacity-100" : "opacity-90"}`}
      style={{ maxHeight: open ? (typeof h === "number" ? h : 9999) : 0 }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
}

/* =========================================================
   Main Component
========================================================= */
export default function Shadbala({
  data,
  norm
}: {
  data?: any;
  norm?: NormLike;
}) {
  const { components, totals, pillarSummary, classicalComponents, classicalTotals } = useMemo(
    () => extractShadbala(data, norm),
    [data, norm]
  );
  const hasPlanetCards = components && Object.keys(components).length;

  const [openTipId, setOpenTipId] = useState<string | null>(null);
  const { open, setOpen } = usePersistentToggle("ka:collapse:shadbala", true);
  const { flag: showClassic, setFlag: setShowClassic } = usePersistentFlag("ka:shadbala:classic", false);
  const [spot, setSpot] = useState<{ open: boolean; planet?: string; value?: number; classical?: { rupa?: number; virupa?: number } }>({ open: false });

  if (!hasPlanetCards && !pillarSummary.length) return null;

  const planetList = hasPlanetCards ? [
    ...PLANET_ORDER.filter(p => components![p]),
    ...Object.keys(components!).filter(p => !PLANET_ORDER.includes(p))
  ] : [];

  const body = hasPlanetCards ? (
    <>
      <ComparisonsStories totals={totals ?? undefined} />

      <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory no-scrollbar mt-4">
        <div className="flex gap-4">
          {planetList.map((planet) => (
            <div key={planet} className="min-w-[90%]">
              <PlanetCard
                name={planet}
                pillars={components![planet]}
                total={totals?.[planet]}
                classicalPlanet={{ totals: classicalTotals?.[planet], comps: classicalComponents?.[planet] }}
                showClassic={showClassic}
                openTipId={openTipId}
                setOpenTipId={setOpenTipId}
                onOpenSpotlight={(p, v, c) => setSpot({ open: true, planet: p, value: v, classical: c })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {planetList.map((planet) => (
          <PlanetCard
            key={planet}
            name={planet}
            pillars={components![planet]}
            total={totals?.[planet]}
            classicalPlanet={{ totals: classicalTotals?.[planet], comps: classicalComponents?.[planet] }}
            showClassic={showClassic}
            openTipId={openTipId}
            setOpenTipId={setOpenTipId}
            onOpenSpotlight={(p, v, c) => setSpot({ open: true, planet: p, value: v, classical: c })}
          />
        ))}
      </div>

      <ComparePanel planets={planetList} components={components!} totals={totals ?? null} />
      <InlineFAQ />

      <SpotlightModal
        open={spot.open}
        onClose={() => setSpot({ open: false })}
        planet={spot.planet ?? "Planet"}
        value={spot.value ?? 0}
        classical={spot.classical}
      />
    </>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {pillarSummary.map((p, i) => {
        const b = badgeAbsolute(p.value);
        return (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="text-lg">{PILLAR_META[p.key].emoji}</span>
                <div>
                  <div className="font-semibold">{PILLAR_META[p.key].title}</div>
                  <div className="text-[11px] text-white/60">{p.label}</div>
                </div>
              </div>
              <div className={`text-[11px] px-2 py-0.5 rounded-full border ${b.cls}`}>{b.text}</div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                <span>Score</span>
                <span className="text-white/80 font-medium">{fmt1(p.value)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-400 to-violet-500 transition-[width] duration-700 ease-out" style={{ width: `${clamp01(p.value) * 100}%` }} />
              </div>
              <div className="mt-2 text-[11px] text-white/70">
                {PILLAR_META[p.key].hint} <span className="text-white/60">({PILLAR_META[p.key].story(p.value)})</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <section id="shadbala" className="mt-6">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Shadbala (Sixfold Strength)</h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowClassic(!showClassic)}
            className={`hidden sm:inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10 ${
              showClassic ? "bg-white/10" : "bg-white/5"
            }`}
            aria-pressed={showClassic}
            title="Show Classical Rūpa & Virūpa values"
          >
            Classical values
            <span className="inline-block w-8 h-4 rounded-full bg-white/10 relative">
              <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${showClassic ? "translate-x-4" : ""}`} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
          >
            <span>{open ? "Hide" : "Show"}</span>
            <span className={`inline-block transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
          </button>
        </div>
      </div>

      <div className="sm:hidden mb-2">
        <button
          type="button"
          onClick={() => setShowClassic(!showClassic)}
          className={`inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10 ${
            showClassic ? "bg-white/10" : "bg-white/5"
          }`}
          aria-pressed={showClassic}
          title="Show Classical Rūpa & Virūpa values"
        >
          Classical values
          <span className="inline-block w-8 h-4 rounded-full bg-white/10 relative">
            <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${showClassic ? "translate-x-4" : ""}`} />
          </span>
        </button>
      </div>

      <Collapsible open={open}>{body}</Collapsible>
    </section>
  );
}
