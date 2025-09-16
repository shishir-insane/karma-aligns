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
  title: string;                 // Gen-Z friendly label
  hint: string;                  // quick meaning
  story: (v:number)=>string;     // micro-story by value
  sname: string;                 // Sanskrit name for ? tooltip
  sdesc: string;                 // short classical description
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

/* Absolute scale (your spec) */
function badgeAbsolute(value: number) {
  const v = clamp01(value);
  if (v >= 0.70) return { text: "Very strong • Boss Mode",   cls: "border-emerald-400/25 bg-emerald-300/10 text-emerald-300" };
  if (v >= 0.55) return { text: "Average to good • Holding Steady", cls: "border-violet-400/25 bg-violet-300/10 text-violet-300" };
  if (v >= 0.40) return { text: "Weak • Needs a Boost",       cls: "border-amber-400/25 bg-amber-300/10 text-amber-300" };
  return              { text: "Very weak • Needs Support",    cls: "border-rose-400/25 bg-rose-300/10 text-rose-300" };
}

/* =========================================================
   Utils
========================================================= */
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

/* =========================================================
   Data Extraction (NEW shape + backward compatible)
   - NEW:  data.shadbala.components.normalized[planet][pillar]
           data.shadbala.components.virupa_rupa[planet].components.{rupa|virupa}[pillar]
           data.shadbala.components.virupa_rupa[planet].totals.{rupa|virupa}
           data.shadbala.totals.normalized[planet]
   - OLD:  data.shadbala.components[planet][pillar]
           data.shadbala.total[planet]
========================================================= */
function extractShadbala(data?: any, norm?: NormLike) {
  const raw = data?.shadbala ?? data?.shad_bala ?? null;

  let components: Record<string, Partial<Record<PillarKey, number>>> | null = null;
  let totals: Record<string, number> | null = null;

  // classical (optional) maps
  let classicalComponents: Record<string, Partial<Record<PillarKey, { rupa?: number; virupa?: number }>>> = {};
  let classicalTotals: Record<string, { rupa?: number; virupa?: number }> = {};

  // --------- prefer NEW normalized totals/components ----------
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

  // --------- classical: virupa_rupa, if present ----------
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

  // --------- fallback to OLD shape ----------
  if (!components && raw?.components && typeof raw.components === "object") {
    // old shape: raw.components[planet][pillar]
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
    // old shape: raw.total[planet] normalized
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
   Visuals: Radar Chart (SVG)
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

/* =========================================================
   Click-away hook for the ? tooltip
========================================================= */
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
        {/* Header row: wraps on mobile so badge goes to next line */}
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

          {/* Badge + score go full-width on mobile to avoid overflow */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <div className={`text-[10px] px-2 py-0.5 rounded-full border ${b.cls} whitespace-normal leading-tight text-center`}>
              {b.text}
            </div>
            <div className="text-xs text-white/70 ml-auto sm:ml-0">{fmt1(v)}</div>
          </div>
        </div>

        {/* Bar */}
        <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-violet-500 transition-[width] duration-700 ease-out"
            style={{ width: `${clamp01(v) * 100}%` }}
          />
        </div>

        {/* Hint + story + (optional classical) */}
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

function StrengthRing({ value }: { value: number }) {
  const v = clamp01(value);
  const deg = Math.round(v * 360);
  const inset = Math.max(6, 14 - Math.round(v * 10)); // thicker when strong
  const pulse = v >= 0.7 ? 'animate-pulse' : '';
  return (
    <div className={`relative w-24 h-24 ${pulse}`}>
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundImage: `conic-gradient(#a78bfa ${deg}deg, rgba(255,255,255,0.06) ${deg}deg)` }}
      />
      <div className="absolute inset-0 rounded-full bg-black/10 blur-md" />
      <div className="absolute rounded-full bg-white/5 border border-white/10 flex items-center justify-center" style={{ inset }}>
        <div className="text-sm font-semibold">{fmt1(v)}</div>
      </div>
    </div>
  );
}

function PlanetCard({
  name,
  pillars,
  total,
  classicalPlanet,
  showClassic,
  openTipId,
  setOpenTipId
}: {
  name: string;
  pillars: Partial<Record<PillarKey, number>>;
  total?: number;
  classicalPlanet?: { totals?: { rupa?: number; virupa?: number }, comps?: Partial<Record<PillarKey, { rupa?: number; virupa?: number }>> };
  showClassic: boolean;
  openTipId: string | null;
  setOpenTipId: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const totalSafe = clamp01(total ?? 0);
  const b = badgeAbsolute(totalSafe);
  const valuesInOrder = PILLAR_ORDER.map(k => pillars[k] ?? 0);

  const totalStory =
    totalSafe >= 0.7 ? `${name} is in boss mode — expect noticeable results.`
    : totalSafe >= 0.55 ? `${name} has presence — can deliver when you show up.`
    : totalSafe >= 0.4 ? `${name} is muted — manage expectations here.`
    : `${name} is low impact rn — don’t overindex decisions here.`;

  const totR = classicalPlanet?.totals?.rupa;
  const totV = classicalPlanet?.totals?.virupa;

  return (
    <div className="snap-center group rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/8 hover:shadow-[0_10px_30px_rgba(147,51,234,.25)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{PLANET_EMOJI[name] ?? "✨"}</div>
          <div>
            <div className="text-base font-semibold">{name}</div>
            <div className="text-[11px] text-white/60">Shadbala total</div>
          </div>
        </div>
        <div className={`text-[11px] px-2 py-0.5 rounded-full border ${b.cls}`}>{b.text}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center justify-center">
          <StrengthRing value={totalSafe} />
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

/* Inline FAQ (unchanged) */
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
          Your engine normalizes each pillar to 0–1 and blends them (often weighted). We show the
          <strong> totals from your API</strong>. Exact math can vary by tradition.
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
   Comparison Mode (unchanged)
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
                    <div className="h-full bg-gradient-to-r from-pink-400 to-violet-500" style={{ width: `${clamp01(v)*100}%` }} />
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
   Collapsible + toggle helpers (persisted + animated)
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
   Main Component (collapsible + classical toggle)
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

  // one open tooltip at a time across section
  const [openTipId, setOpenTipId] = useState<string | null>(null);

  // collapsible state (persisted)
  const { open, setOpen } = usePersistentToggle("ka:collapse:shadbala", true);

  // NEW: classical toggle (persisted) — OFF by default
  const { flag: showClassic, setFlag: setShowClassic } = usePersistentFlag("ka:shadbala:classic", false);

  if (!hasPlanetCards && !pillarSummary.length) return null;

  const planetList = hasPlanetCards ? [
    ...PLANET_ORDER.filter(p => components![p]),
    ...Object.keys(components!).filter(p => !PLANET_ORDER.includes(p))
  ] : [];

  // Build section body
  const body = hasPlanetCards ? (
    <>
      {/* Swipe on mobile; grid on desktop */}
      <div className="md:hidden -mx-4 px-4 overflow-x-auto snap-x snap-mandatory no-scrollbar">
        <div className="flex gap-4">
          {planetList.map((planet) => (
            <div key={planet} className="min-w-[90%]">
              <PlanetCard
                name={planet}
                pillars={components![planet]}
                total={totals?.[planet]}
                classicalPlanet={{
                  totals: classicalTotals?.[planet],
                  comps: classicalComponents?.[planet]
                }}
                showClassic={showClassic}
                openTipId={openTipId}
                setOpenTipId={setOpenTipId}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
        {planetList.map((planet) => (
          <PlanetCard
            key={planet}
            name={planet}
            pillars={components![planet]}
            total={totals?.[planet]}
            classicalPlanet={{
              totals: classicalTotals?.[planet],
              comps: classicalComponents?.[planet]
            }}
            showClassic={showClassic}
            openTipId={openTipId}
            setOpenTipId={setOpenTipId}
          />
        ))}
      </div>

      <ComparePanel
        planets={planetList}
        components={components!}
        totals={totals ?? null}
      />

      <InlineFAQ />
    </>
  ) : (
    // Fallback: just six pillars overall (no classical here)
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
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-violet-500 transition-[width] duration-700 ease-out"
                  style={{ width: `${clamp01(p.value) * 100}%` }}
                />
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
      {/* Collapsible header + Classical toggle */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Shadbala (Sixfold Strength)</h2>

        <div className="flex items-center gap-2">
          {/* Classical values toggle (doesn't change layout, only reveals text) */}
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
            <span className={`inline-block w-8 h-4 rounded-full bg-white/10 relative`}>
              <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${showClassic ? "translate-x-4" : ""}`} />
            </span>
          </button>

          {/* Collapsible control */}
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

      {/* Mobile: classical toggle below header for reachability */}
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
          <span className={`inline-block w-8 h-4 rounded-full bg-white/10 relative`}>
            <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${showClassic ? "translate-x-4" : ""}`} />
          </span>
        </button>
      </div>

      {/* Animated collapsible content */}
      <Collapsible open={open}>{body}</Collapsible>
    </section>
  );
}
