import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, ChevronDown, ChevronRight, Info } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Pill from "@/components/ui/Pill";
import StrengthRing from "@/components/ui/StrengthRing";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import { H2 } from "../ui/Type";

/**
 * BhavaBala – Shadbala DNA implementation
 * - Mobile-first, swipe on mobile, grid on desktop
 * - Numbers → Stories → Visuals → Interactions
 * - Boss Mode ≥ 0.70
 * - Classical toggle (inline, no layout shift)
 * - Spotlight modal per house
 * - SVG charts, no heavy libs
 */

// -----------------------
// Types
// -----------------------

type LegacyCount = { house: number; benefics: number; malefics: number; net: number };

type NormalizedHouse = { bhava_drik: number; kendradhi: number };

type VirupaRupaHouse = {
  components: {
    virupa: Record<string, number>;
    rupa: Record<string, number>;
  };
  totals: { virupa: number; rupa: number };
};

type BhavaBalaApi = {
  bhava_bala: {
    legacy_counts: LegacyCount[];
    normalized: Record<string, NormalizedHouse>; // keys "1".."12"
    virupa_rupa?: Record<string, VirupaRupaHouse>;
    totals?: {
      virupa?: Record<string, number>;
      rupa?: Record<string, number>;
      tier?: Record<string, string>;
    };
    summary?: { ranking_by_rupa?: [number, number][] };
  };
};

type ExtractedHouse = {
  id: number; // 1..12
  normalized: { total: number; bhava_drik: number; kendradhi: number };
  classical?: {
    virupa: number;
    rupa: number;
    tier?: string;
    components?: {
      virupa: Record<string, number>;
      rupa: Record<string, number>;
    };
  };
  legacy: LegacyCount;
  theme: string[]; // human-friendly tags per house
};

// -----------------------
// House themes (simple, can be localized later)
// -----------------------

const HOUSE_THEMES: Record<number, string[]> = {
  1: ["Self", "Body", "Identity"],
  2: ["Finance", "Speech", "Family"],
  3: ["Courage", "Siblings", "Skills"],
  4: ["Home", "Mother", "Emotions"],
  5: ["Creativity", "Children", "Joy"],
  6: ["Service", "Health", "Rivals"],
  7: ["Partnerships", "Contracts", "Public"],
  8: ["Depth", "Change", "Mystery"],
  9: ["Dharma", "Belief", "Mentors"],
  10: ["Career", "Status", "Authority"],
  11: ["Gains", "Networks", "Aspirations"],
  12: ["Rest", "Retreat", "Release"],
};

const HOUSE_NAMES: Record<number, string> = {
  1: "Self & Identity",
  2: "Money & Speech",
  3: "Courage & Skills",
  4: "Home & Emotions",
  5: "Creativity & Joy",
  6: "Service & Health",
  7: "Partnerships & Public",
  8: "Change & Depth",
  9: "Belief & Mentors",
  10: "Career & Status",
  11: "Gains & Networks",
  12: "Rest & Release",
};

const HOUSE_SUMMARY: Record<number, string> = {
  1: "Vitality, self-image, how you initiate.",
  2: "Resources, voice, values, family support.",
  3: "Drive, learning loops, siblings & peers.",
  4: "Emotional base, home, roots, mother.",
  5: "Play, romance, creation, children.",
  6: "Routines, health, service, solving frictions.",
  7: "One-to-one bonds, contracts, visibility.",
  8: "Transformations, shared resources, mysteries.",
  9: "Faith, purpose, teachers, long journeys.",
  10: "Reputation, authority, public milestones.",
  11: "Allies, communities, gains, goals.",
  12: "Rest, retreats, endings, the subconscious.",
};

const WHAT_IF_HOUSE: Record<number, { strong: string; weak: string }> = {
  1: { strong: "Clear presence; momentum to start.", weak: "Low initiative; protect energy & basics." },
  2: { strong: "Money voice is confident; steady income.", weak: "Budget drift; watch impulse buys." },
  3: { strong: "Practice sticks; content & skill growth.", weak: "Pushback to habits; start tiny reps." },
  4: { strong: "Grounded; sleep & space refill you.", weak: "Declutter; emotional hygiene first." },
  5: { strong: "Play → prototypes → traction.", weak: "Don’t force sparkle; schedule joy." },
  6: { strong: "Systems click; health routines hold.", weak: "Reduce load; fix one friction daily." },
  7: { strong: "Partnerships deliver; deal flow rises.", weak: "Clarify boundaries; fewer but better ties." },
  8: { strong: "Deep work pays; debt or research moves.", weak: "Pace change; protect recovery windows." },
  9: { strong: "Belief fuels; mentors appear.", weak: "Revisit why; micro-rituals beat grand plans." },
  10: { strong: "Visibility up; ship work you’re proud of.", weak: "Quiet build; reputation compounds later." },
  11: { strong: "Allies respond; network effects kick in.", weak: "Nurture a few nodes; ask specifically." },
  12: { strong: "Rest heals; rich inner life.", weak: "Taper overstimulation; close tabs literally." },
};

// Score scale badge — same copy feel as Shadbala
// Score scale badge — color-coded like Shadbala
function scaleBadge(value: number) {
  if (value >= 0.70) {
    return {
      text: "Very strong • Boss Mode",
      className:
        "border-emerald-400/25 bg-emerald-300/10 text-emerald-300",
    };
  }
  if (value >= 0.55) {
    return {
      text: "Average to good • Holding Steady",
      className:
        "border-violet-400/25 bg-violet-300/10 text-violet-300"
    };
  }
  if (value >= 0.40) {
    return {
      text: "Weak • Needs a Boost",
      className:
        "border-amber-400/25 bg-amber-300/10 text-amber-300",
    };
  }
  return {
    text: "Very weak • Needs Support",
    className:
      "border-rose-400/25 bg-rose-300/10 text-rose-300",
  };
}


// -----------------------
// Persistence hooks (localStorage)
// -----------------------

function usePersistentToggle(key: string, initial = false) {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { }
  }, [key, value]);
  return [value, setValue] as const;
}

function houseMicro(h: ExtractedHouse) {
  const v = h.normalized.total;
  if (v >= 0.70) return "Boss mode — noticeable results.";
  if (v >= 0.55) return "Has presence — delivers when you show up.";
  if (v >= 0.40) return "Muted — manage expectations here.";
  return "Low now — add support before pushing.";
}


function usePersistentFlag(key: string, initial = true) {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : initial;
    } catch {
      return initial;
    }
  });
  const dismiss = () => setValue(false);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { }
  }, [key, value]);
  return { show: value, dismiss } as const;
}

function useInView<T extends HTMLElement>(opts?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2, ...opts });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [opts]);
  return { ref, inView } as const;
}

// One-time nudge
function useOneTimeNudge(key: string) {
  return usePersistentFlag(key, true);
}

// -----------------------
// Badging & thresholds
// -----------------------

const BOSS_THRESHOLD = 0.7;

function badgeAbsoluteBhava(value: number) {
  if (value >= BOSS_THRESHOLD) return { label: "Boss House", tone: "emerald", boss: true };
  if (value >= 0.55) return { label: "Holding steady", tone: "indigo", boss: false };
  if (value >= 0.4) return { label: "Needs a boost", tone: "amber", boss: false };
  return { label: "Needs support", tone: "rose", boss: false };
}

// -----------------------
// Extractor
// -----------------------

function extractBhavaBala(api: BhavaBalaApi) {
  const src = api?.bhava_bala;
  if (!src) return { houses: [], ranking: [] as number[] };

  const legacyByHouse = new Map<number, LegacyCount>();
  (src.legacy_counts || []).forEach((it) => legacyByHouse.set(it.house, it));

  const houses: ExtractedHouse[] = [];
  for (let i = 1; i <= 12; i++) {
    const k = String(i);
    const norm: NormalizedHouse = src.normalized?.[k] || { bhava_drik: 0.5, kendradhi: 0.5 };
    const total = (norm.bhava_drik + norm.kendradhi) / 2;
    const virupaTotal = src.totals?.virupa?.[k];
    const rupaTotal = src.totals?.rupa?.[k];
    const tier = src.totals?.tier?.[k];
    const classicalComp = src.virupa_rupa?.[k]?.components;

    houses.push({
      id: i,
      normalized: { total, bhava_drik: norm.bhava_drik, kendradhi: norm.kendradhi },
      classical:
        virupaTotal != null || rupaTotal != null
          ? {
            virupa: virupaTotal ?? 0,
            rupa: rupaTotal ?? 0,
            tier,
            components: classicalComp,
          }
          : undefined,
      legacy: legacyByHouse.get(i) || { house: i, benefics: 0, malefics: 0, net: 0 },
      theme: HOUSE_THEMES[i] || [],
    });
  }

  // Ranking by normalized total, fallback to rupa when tie-equal
  const ranking = [...houses]
    .sort((a, b) => {
      if (b.normalized.total === a.normalized.total) {
        const ar = a.classical?.rupa ?? 0;
        const br = b.classical?.rupa ?? 0;
        return br - ar;
      }
      return b.normalized.total - a.normalized.total;
    })
    .map((h) => h.id);

  return { houses, ranking };
}

// -----------------------
// Labels
// -----------------------

function pillarLabel(key: "bhava_drik" | "kendradhi", classicalOn: boolean) {
  if (classicalOn) return key === "bhava_drik" ? "Bhāva Drik" : "Kendradhi";
  // Gen-Z wording (clear & friendly):
  return key === "bhava_drik" ? "Support Power" : "Placement Power";
}

// -----------------------
// PillarRow (stack on mobile; no overflow)
// -----------------------

function PillarRow({
  label,
  value,
  classical,
}: {
  label: string;
  value: number;
  classical?: { virupa?: number; rupa?: number };
}) {
  const tone = value >= 0.7 ? "bg-emerald-500" : value >= 0.55 ? "bg-violet-500" : value >= 0.4 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="py-1">
      {/* Row 1: label + tooltip + numbers (wraps on mobile) */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 text-sm text-white/80 flex items-center gap-1">
          <span className="truncate">{label}</span>
          <Tooltip
            content={
              label.includes("Support")
                ? "Classical: Bhāva Drik — aspectual support to this house."
                : "Classical: Kendradhi — placement advantage (Kendra > Panaphara > Apoklima)."
            }
          >
            <Info className="size-3.5 text-white/50" />
          </Tooltip>
        </div>
        <div className="text-xs tabular-nums text-white/70">{(value * 100).toFixed(1)}%</div>
        {classical && (
          <div className="text-xs text-white/60">
            {classical.virupa != null && `${Math.round(classical.virupa)} v • `}
            {classical.rupa != null && `${classical.rupa.toFixed(2)} r`}
          </div>
        )}
      </div>
      {/* Row 2: bar (full width) */}
      <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

// -----------------------
// HouseCard
// -----------------------

function HouseCard({
  h,
  classicalOn,
  onOpen,
  compareOn,
  pinnedId,
  setPinnedId,
}: {
  h: ExtractedHouse;
  classicalOn: boolean;
  onOpen: (id: number) => void;
  compareOn: boolean;
  pinnedId: number | null;
  setPinnedId: (id: number | null) => void;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const badge = badgeAbsoluteBhava(h.normalized.total);
  const boss = badge.boss;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      ref={ref}
      className={
        `
    className="w-full rounded-2xl border bg-white/5 p-4 sm:p-5 transition-all
    hover:bg-white/10
    grid grid-rows-[auto,auto,1fr,auto]
    ${boss
          ? // Subtle Boss glow (emerald ring + soft outer halo)
          "border-emerald-400/30 ring-1 ring-emerald-400/30 shadow-[0_0_24px_rgba(16,185,129,.18)]"
          : // Default violet hover like Shadbala
          "border-white/10 hover:shadow-[0_10px_30px_rgba(147,51,234,.18)]"
        }
    `
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h2>House {h.id}</h2>
          {(() => {
            const scale = scaleBadge(h.normalized.total);
            return <Badge className={`px-2 py-1 ${scale.className}`}>{scale.text}</Badge>;
          })()}
        </div>
      </div>

      {/* Main visual */}
      <div className="mt-3 flex items-center gap-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: inView ? 1 : 0.95, opacity: inView ? 1 : 0.6 }}>
          <StrengthRing value={h.normalized.total} boss={boss} />
        </motion.div>
      </div>

      {/* Micro story */}
      <div className="mt-3 text-white/80 truncate min-h-[20px]" title={houseMicro(h)}>
        {houseMicro(h)}
       </div>
      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {compareOn && (
          <Button
            variant={pinnedId === h.id ? "secondary" : "ghost"}
            className="border border-white/10"
            onClick={() => setPinnedId(pinnedId === h.id ? null : h.id)}
          >
            {pinnedId === h.id ? "Unpin" : "Compare"}
          </Button>
        )}
        <Button variant="ghost" className="border border-white/10" onClick={() => onOpen(h.id)}>
          View breakdown
        </Button>
        <Button
          variant="ghost"
          className="border border-white/10"
          onClick={() => setShowDetails((s) => !s)}
          aria-expanded={showDetails}
        >
          {showDetails ? "Hide details" : "Show details"}
        </Button>
      </div>

      {/* Optional on-card details (closed by default) */}
      <AnimatePresence initial={false}>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <PillarRow
                label={pillarLabel("bhava_drik", classicalOn)}
                value={h.normalized.bhava_drik}
                classical={
                  classicalOn
                    ? { virupa: h.classical?.components?.virupa?.bhava_drik, rupa: h.classical?.components?.rupa?.bhava_drik }
                    : undefined
                }
              />
              <PillarRow
                label={pillarLabel("kendradhi", classicalOn)}
                value={h.normalized.kendradhi}
                classical={
                  classicalOn
                    ? { virupa: h.classical?.components?.virupa?.kendradhi, rupa: h.classical?.components?.rupa?.kendradhi }
                    : undefined
                }
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
                <Badge className="bg-emerald-600/70">+{h.legacy.benefics} benefic</Badge>
                <Badge className="bg-rose-600/70">{h.legacy.malefics} malefic</Badge>
                <span className={`${h.legacy.net >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  net {h.legacy.net >= 0 ? `+${h.legacy.net}` : h.legacy.net}
                </span>
              </div>
              {classicalOn && (
                <div className="mt-1 text-xs text-white/60 break-words">
                  Classical: {Math.round(h.classical?.virupa ?? 0)} virupa • {(h.classical?.rupa ?? 0).toFixed(2)} rupa {h.classical?.tier ? `• ${h.classical.tier}` : ""}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare deltas under bars (only when compare is ON and a different house is pinned) */}
      {/* This is placed at the bottom for clarity; move if you prefer near the bars */}
      {/* The card needs pinned info via props */}
    </div>
  );
}

// -----------------------
// HouseWheel (SVG radial heatmap)
// -----------------------

function HouseWheel({ houses, onOpen }: { houses: ExtractedHouse[]; onOpen: (id: number) => void }) {
  const size = 280;
  const r = size / 2;
  const inner = r * 0.45;
  const outer = r * 0.95;
  const toXY = (ang: number, rad: number) => ({ x: r + rad * Math.cos(ang), y: r + rad * Math.sin(ang) });

  const wedges = houses.map((h, idx) => {
    const startAng = -Math.PI / 2 + idx * ((2 * Math.PI) / 12);
    const endAng = startAng + (2 * Math.PI) / 12;
    const p1 = toXY(startAng, inner);
    const p2 = toXY(startAng, outer);
    const p3 = toXY(endAng, outer);
    const p4 = toXY(endAng, inner);

    const largeArc = endAng - startAng > Math.PI ? 1 : 0;
    const path = [`M ${p1.x} ${p1.y}`, `L ${p2.x} ${p2.y}`, `A ${outer} ${outer} 0 ${largeArc} 1 ${p3.x} ${p3.y}`, `L ${p4.x} ${p4.y}`, `A ${inner} ${inner} 0 ${largeArc} 0 ${p1.x} ${p1.y}`, "Z"].join(" ");

    const v = Math.max(0, Math.min(1, h.normalized.total));
    const fill = v >= 0.7 ? "fill-emerald-500/80" : v >= 0.55 ? "fill-violet-400/70" : v >= 0.4 ? "fill-amber-500/70" : "fill-rose-500/70";
    const halo = v >= 0.7 ? "shadow-[0_0_20px_rgba(16,185,129,.75)]" : "";

    return (
      <g key={h.id} className="cursor-pointer" onClick={() => onOpen(h.id)}>
        <path d={path} className={`${fill} stroke-white/10 ${halo}`} />
        {/* Label */}
        {(() => {
          const m = toXY(startAng + (endAng - startAng) / 2, (inner + outer) / 2);
          return (
            <text x={m.x} y={m.y} textAnchor="middle" dominantBaseline="middle" className="select-none text-[12px] fill-white">
              {h.id}
            </text>
          );
        })()}
      </g>
    );
  });

  return (
    <div className="relative mx-auto">
      <svg width={size} height={size} className="block">
        <defs>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#softGlow)">{wedges}</g>
        {/* Center dot */}
        <circle cx={r} cy={r} r={4} className="fill-white/60" />
      </svg>
    </div>
  );
}

// -----------------------
// Spotlight Modal
// -----------------------

function HouseSpotlightModal({
  h,
  open,
  onClose,
  classicalOn,
}: {
  h?: ExtractedHouse;
  open: boolean;
  onClose: () => void;
  classicalOn: boolean;
}) {
  if (!open || !h) return null;
  const badge = badgeAbsoluteBhava(h.normalized.total);
  const name = HOUSE_NAMES[h.id];
  const summary = HOUSE_SUMMARY[h.id];
  const whatIf = WHAT_IF_HOUSE[h.id];

  return (
    <Modal open={open} onClose={onClose}>
      {/* Header band with subtle gradient like Shadbala */}
      <div className="rounded-xl bg-gradient-to-br from-[#1b1e27] to-[#0f1117] p-4 mb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-sm">House</span>
              <button
                className="underline decoration-transparent hover:decoration-white/30 focus:decoration-white/40"
                onClick={() => onOpen(h.id)}
                aria-label={`Open Spotlight for House ${h.id}`}
              >
                <h3 className="inline">{h.id}</h3>
              </button>
            </div>
            <p className="text-white/70 text-xs">{HOUSE_NAMES[h.id]}</p>
          </div>
          {(() => {
            const scale = scaleBadge(h.normalized.total);
            return (
              <Badge className={`border ${scale.className}`}>
                {scale.text}
              </Badge>
            );
          })()}
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-6">
          <div className="flex flex-col items-center gap-3">
            <StrengthRing value={h.normalized.total} boss={badge.boss} />
            <div className="text-xs text-white/70">
              Normalized total <span className="font-mono">{h.normalized.total.toFixed(2)}</span>
            </div>
          </div>
          <div>
            {/* Breakdown bars */}
            <PillarRow
              label={pillarLabel("bhava_drik", classicalOn)}
              value={h.normalized.bhava_drik}
              classical={
                classicalOn
                  ? { virupa: h.classical?.components?.virupa?.bhava_drik, rupa: h.classical?.components?.rupa?.bhava_drik }
                  : undefined
              }
            />
            <PillarRow
              label={pillarLabel("kendradhi", classicalOn)}
              value={h.normalized.kendradhi}
              classical={
                classicalOn
                  ? { virupa: h.classical?.components?.virupa?.kendradhi, rupa: h.classical?.components?.rupa?.kendradhi }
                  : undefined
              }
            />

            {/* Classical totals row */}
            <div className="mt-2 text-xs text-white/60">
              Classical total: <span className="font-mono">{Math.round(h.classical?.virupa ?? 0)} v</span> •{" "}
              <span className="font-mono">{(h.classical?.rupa ?? 0).toFixed(2)} r</span>
              {h.classical?.tier ? <span> • {h.classical.tier}</span> : null}
            </div>
          </div>
        </div>
      </div>

      {/* Meaning (like the planet “signifies” line) */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-white font-medium mb-1">What this house signifies</div>
        <div className="text-white/70 text-sm">{summary}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {HOUSE_THEMES[h.id]?.map((t) => (
            <Pill key={t} className="bg-white/10 text-white/80">
              {t}
            </Pill>
          ))}
        </div>
      </div>

      {/* WHAT IF card (strong / weak) */}
      <div className="mt-4 rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4">
        <div className="text-white/70 text-xs tracking-wide mb-2">WHAT IF?</div>
        <div className="text-white/90 text-sm">
          <span className="font-semibold">Strong House {h.id}:</span> {whatIf?.strong}
        </div>
        <div className="text-white/90 text-sm mt-2">
          <span className="font-semibold">Weak House {h.id}:</span> {whatIf?.weak}
        </div>
      </div>

      {/* Benefic / Malefic influencers (kept, no “Legacy” word) */}
      <div className="mt-4 text-xs text-white/70 flex flex-wrap gap-2">
        <Badge className="bg-emerald-600/70">+{h.legacy.benefics} benefic</Badge>
        <Badge className="bg-rose-600/70">{h.legacy.malefics} malefic</Badge>
        <span className={h.legacy.net >= 0 ? "text-emerald-300" : "text-rose-300"}>
          net {h.legacy.net >= 0 ? `+${h.legacy.net}` : h.legacy.net}
        </span>
      </div>
    </Modal>
  );
}

// -----------------------
// Quick Reads (3 stories, numeric comparisons)
// -----------------------

function QuickReadsRail({ ranking, get }: { ranking: number[]; get: (id: number) => ExtractedHouse | undefined }) {
  const v = (n: number) => get(n)?.normalized.total ?? 0;
  const fmt = (x: number) => x.toFixed(2);

  const stories = [
    {
      head: `Self vs Partners — H1 (${fmt(v(1))}) ${v(1) >= v(7) ? "≥" : "<"} H7 (${fmt(v(7))})`,
      body: v(1) >= v(7)
        ? "Right now, autonomy > agreements. Negotiate, don’t over-promise."
        : "Partnerships carry momentum. Co-create, share credit, keep boundaries.",
    },
    {
      head: `Home vs Career — H4 (${fmt(v(4))}) ${v(4) >= v(10) ? "≥" : "<"} H10 (${fmt(v(10))})`,
      body: v(4) >= v(10)
        ? "Stabilize base first; visibility follows. Protect rest & routines."
        : "Stage lights are on; ship work you’re proud of. Keep a buffer at home.",
    },
    {
      head: `Gains vs Joy — H11 (${fmt(v(11))}) ${v(11) >= v(5) ? "≥" : "<"} H5 (${fmt(v(5))})`,
      body: v(11) >= v(5)
        ? "Network effects > solo play. Ask, DM, collaborate."
        : "Make first, monetize later. Play → prototypes → traction.",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {stories.map((s, i) => (
        <div key={i} className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-3">
          <div className="text-white text-sm font-medium">{s.head}</div>
          <div className="mt-1 text-white/70 text-xs">{s.body}</div>
        </div>
      ))}
    </div>
  );
}

// Optional secondary micro-stories (kept from earlier plan)
function QuickReadsBhava({ ranking, get }: { ranking: number[]; get: (id: number) => ExtractedHouse | undefined }) {
  if (!ranking.length) return null;
  const h11 = get(11);
  const h5 = get(5);
  const h6 = get(6);
  const h9 = get(9);

  const cards: { title: string; body: string }[] = [];

  const core = [1, 4, 7, 10].every((id) => get(id) && get(id)!.normalized.total >= 0.55);
  if (core) {
    cards.push({ title: "Foundations aligned", body: "Lagna–Home–Partnership–Career form a stable square. Stack wins here." });
  }

  if (h11 && h5) {
    const d = h11.normalized.total - h5.normalized.total;
    if (Math.abs(d) > 0.1) {
      cards.push({
        title: d > 0 ? "Gains > Creativity" : "Joy > Gains",
        body: d > 0 ? "Collabs and networks outpace solo play right now." : "Lean into creative flow; gains follow.",
      });
    }
  }

  if (h6 && h9) {
    const d = h6.normalized.total - h9.normalized.total;
    if (Math.abs(d) > 0.1) {
      cards.push({
        title: d > 0 ? "Duties first" : "Ideals lead",
        body: d > 0 ? "Keep buffers for health & chores—then scale belief work." : "Mentor energy is high; channel into projects.",
      });
    }
  }

  if (!cards.length) {
    cards.push({ title: "Balanced chart", body: "No loud imbalances detected. Nudge whichever area you value most." });
  }

  while (cards.length < 3) {
    const FALLBACKS = [
      { title: "Watch House 8", body: "Deep work > surface wins. Pace change." },
      { title: "Buff House 6", body: "Routines beat sprints. Protect sleep." },
      { title: "House 11 ping", body: "Ask your network; low-friction gains." },
    ];
    cards.push(FALLBACKS[cards.length % FALLBACKS.length]);
  }
  if (cards.length > 3) cards.length = 3;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {cards.map((c, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="size-4" />
            {c.title}
          </div>
          <div className="mt-1 text-sm text-white/70">{c.body}</div>
        </div>
      ))}
    </div>
  );
}

// -----------------------
// Explainers
// -----------------------

function Explainers() {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-white font-medium mb-1">What is Bhava Bala?</div>
        <div className="text-white/70 text-sm">
          It’s a quick read on how “charged” each house is right now. Think of every house as a room in your life (career, home, relationships) and
          Bhava Bala is the current power level of that room.
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-white font-medium mb-1">How is it calculated?</div>
        <div className="text-white/70 text-sm">
          We blend two signals: <b>Support Power</b> (classical: Bhāva Drik — aspects helping the house) and <b>Placement Power</b> (classical:
          Kendradhi — whether the house sits in easy vs. effort zones like Kendra/Panaphara/Apoklima). We normalize 0–1 for clarity; toggle “Classical
          values” to see virupa/rūpa.
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-white font-medium mb-1">Reading the scale</div>
        <div className="text-white/70 text-sm">
          <b>≥ 0.70</b> Very strong (Boss Mode) • <b>0.55–0.69</b> Holding Steady • <b>0.40–0.54</b> Needs a Boost • <b>&lt; 0.40</b> Needs Support.
          Classical tiers (virupa/rūpa) add depth for astrologers.
        </div>
      </div>
    </div>
  );
}

// -----------------------
// Main component
// -----------------------

export default function BhavaBala({ data }: { data: BhavaBalaApi }) {
  const { houses, ranking } = useMemo(() => extractBhavaBala(data), [data]);
  const byId = (id: number) => houses.find((h) => h.id === id);

  const [open, setOpen] = usePersistentToggle("ka:bhava:open", true);
  const [classicalOn, setClassicalOn] = usePersistentToggle("ka:bhava:classical", false);
  const [wheelView, setWheelView] = usePersistentToggle("ka:bhava:view:wheel", true);
  const { show: showNudge, dismiss: dismissNudge } = useOneTimeNudge("ka:bhava:spotlight:nudge");

  const [compareOn, setCompareOn] = usePersistentToggle("ka:bhava:compare", false);
  const [pinnedId, setPinnedId] = useState<number | null>(null);

  const [activeId, setActiveId] = useState<number | null>(null);
  const activeHouse = activeId ? byId(activeId) : undefined;

  return (
    <div className="p-2 md:p-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="heading-shadow-container" data-text="Bhava Bala (House Strength)">
          <H2 className="hero-heading">Bhava Bala (House Strength)</H2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <span>Wheel</span>
            <Switch checked={wheelView} onCheckedChange={setWheelView} />
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <span>Classical values</span>
            <Switch checked={classicalOn} onCheckedChange={setClassicalOn} />
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <span>Compare</span>
            <Switch
              checked={compareOn}
              onCheckedChange={(v) => {
                setCompareOn(v);
                if (!v) setPinnedId(null);
              }}
            />
          </div>
          <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20" onClick={() => setOpen(!open)}>
            {open ? (
              <>
                <ChevronDown className="mr-1 size-4" />
                Hide
              </>
            ) : (
              <>
                <ChevronRight className="mr-1 size-4" />
                Show
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Reads rail (Shadbala-style) */}
      {open && (
        <div className="mt-4">
          <QuickReadsRail ranking={ranking} get={byId} />
        </div>
      )}

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 space-y-6">
              {/* Optional additional micro-stories */}
              <QuickReadsBhava ranking={ranking} get={byId} />

              {/* Wheel / Grid view */}
              {wheelView ? (
                <div className="mt-2">
                  <HouseWheel
                    houses={houses}
                    onOpen={(id) => {
                      setActiveId(id);
                      dismissNudge();
                    }}
                  />
                  {showNudge && <div className="mt-2 text-center text-sm text-white/70">Tap a house for Spotlight ↗</div>}
                </div>
              ) : (
                <div
                  className="
                    flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2
                    sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:overflow-visible
                  "
                >
                  {houses.map((h) => (
                    <div
                      key={h.id}
                      className="
                        min-w-[85%] snap-start
                        sm:min-w-0
                      "
                    >
                      <HouseCard
                        h={h}
                        classicalOn={classicalOn}
                        onOpen={(id) => {
                          setActiveId(id);
                          dismissNudge();
                        }}
                        compareOn={compareOn}
                        pinnedId={pinnedId}
                        setPinnedId={setPinnedId}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spotlight */}
      <HouseSpotlightModal h={activeHouse} open={!!activeId} onClose={() => setActiveId(null)} classicalOn={classicalOn} />

      {/* Gen-Z explainers */}
      <Explainers />
    </div>
  );
}
