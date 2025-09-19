"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, HelpCircle, Eye, PanelsTopLeft } from "lucide-react";

/* --- UI (mirror Bhava imports) --- */
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import StrengthRing from "@/components/ui/StrengthRing";
import BossHouseCard from "@/components/ui/BossHouseCard";
import NonBossHouseCard from "@/components/ui/NonBossHouseCard";
import Pill from "@/components/ui/Pill";
import PillarBar from "@/components/ui/PillarBar";

import QuickRail from "@/components/ui/QuickRail";
import QuickCard from "@/components/ui/QuickCard";
import SpokeWheel from "@/components/ui/SpokeWheel";
import Spotlight from "@/components/ui/Spotlight";
import SectionShell from "@/components/ui/SectionShell";

import AnimatedScaleBadge from "@/components/ui/AnimatedScaleBadge";
import Sparkles from "@/components/effects/Sparkles";
import useHaptics from "@/components/hooks/useHaptics";
import AchievementToast from "@/components/achievements/AchievementToast";
import QuestCallout from "@/components/ui/QuestCallout";

import FunFactChip from "@/components/ui/FunFactChip";
import StickerTag from "@/components/ui/StickerTag";
import ReferenceButton from "@/components/classical/ReferenceButton";
import PrintButton from "@/components/ui/PrintButton";
import WiggleOnMount from "@/components/motion/WiggleOnMount";
import BossWeakBadgeFeed from "@/components/ui/BossWeakBadgeFeed";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import ShareLite from "@/components/share/ShareLite";
import AxisBadgeStories from "@/components/ui/AxisBadgeStories";
import ResponsiveActionBar from "@/components/ui/ResponsiveActionBar";

/* --- Hooks --- */
import usePersistentToggle from "@/components/hooks/usePersistentToggle";
import useOneTimeNudge from "@/components/hooks/useOneTimeNudge";

/* --- Tokens / Utils / Copy (planet variants) --- */
import { bucket } from "@/components/tokens/scales";
import { PLANET_THEMES, PILLAR_LABELS } from "@/components/tokens/Shadbala";
import { wittyPlanetLine, planetSignificance, ifStrong as ifStrongPlanet, ifWeak as ifWeakPlanet } from "@/components/copy/shadbalaCopy";
import { isBoss, detectPlanetAchievements, weakPlanetQuests } from "@/components/achievements/shadbala";

/* ---------- Types (planet flavor; analogous to Bhava) ---------- */
type PillarKey = "sthana" | "dig" | "kala" | "cheshta" | "naisargika" | "drik";
type PlanetId = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn" | "Rahu" | "Ketu";

type NormalizedPlanet = Partial<Record<PillarKey, number>>;
type VirupaRupaPlanet = {
  components?: { virupa?: Partial<Record<PillarKey, number>>; rupa?: Partial<Record<PillarKey, number>> };
  totals?: { virupa?: number; rupa?: number };
};
type ShadbalaApi = {
  shadbala: {
    components: {
      normalized: Record<PlanetId, NormalizedPlanet>;
      virupa_rupa?: Record<PlanetId, VirupaRupaPlanet>;
    };
    totals?: {
      normalized?: Record<PlanetId, number>;
      virupa?: Record<PlanetId, number>;
      rupa?: Record<PlanetId, number>;
      tier?: Record<PlanetId, string>;
    };
  };
};

type ExtractedPlanet = {
  id: PlanetId;
  normalized: { total: number } & NormalizedPlanet;
  classical?: {
    virupa: number;
    rupa: number;
    tier?: string;
    components?: { virupa?: Partial<Record<PillarKey, number>>; rupa?: Partial<Record<PillarKey, number>> };
  };
  theme: string[];
};

/* ---------- Helpers (mirror Bhava’s inline extractor style) ---------- */
const PLANET_ORDER: PlanetId[] = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];
const clamp01 = (n: number) => Math.max(0, Math.min(1, n ?? 0));
const avg01 = (o: Record<string, number>) => {
  const vals = Object.values(o).filter((v): v is number => typeof v === "number");
  return vals.length ? clamp01(vals.reduce((a,b)=>a+b,0) / vals.length) : 0;
};

function extractShadbala(data: ShadbalaApi) {
  const comp = data.shadbala.components;
  const totals = data.shadbala.totals ?? {};

  const planets: ExtractedPlanet[] = PLANET_ORDER
    .filter((id) => !!comp.normalized[id])
    .map((id) => {
      const n = comp.normalized[id] ?? {};
      const provided = totals.normalized?.[id];
      const total = typeof provided === "number" ? clamp01(provided) : avg01(n as any);

      const vr = comp.virupa_rupa?.[id];
      const classical =
        (vr?.totals?.rupa != null || vr?.totals?.virupa != null || totals.rupa?.[id] != null || totals.virupa?.[id] != null)
          ? {
              virupa: Math.round((vr?.totals?.virupa ?? totals.virupa?.[id] ?? 0) as number),
              rupa: Number(((vr?.totals?.rupa ?? totals.rupa?.[id] ?? 0) as number).toFixed(6)),
              tier: totals.tier?.[id],
              components: { virupa: vr?.components?.virupa ?? {}, rupa: vr?.components?.rupa ?? {} },
            }
          : undefined;

      return {
        id,
        normalized: { total, ...(n as any) },
        classical,
        theme: PLANET_THEMES[id] ?? [],
      };
    });

  const ranking = [...planets]
    .sort((a,b) =>
      b.normalized.total === a.normalized.total
        ? (b.classical?.rupa ?? 0) - (a.classical?.rupa ?? 0)
        : b.normalized.total - a.normalized.total
    ).map(p => p.id);

  return { planets, ranking };
}

/* ---------- Stickers (local, like Bhava’s HOUSE_STICKERS) ---------- */
type StickerTone = "emerald" | "violet" | "rose" | "amber";
const PLANET_STICKERS: Record<PlanetId, { emoji: string; label: string; tone?: StickerTone }> = {
  Sun: { emoji:"☀️", label:"center stage", tone:"emerald" },
  Moon:{ emoji:"🌙", label:"soft power", tone:"violet" },
  Mars:{ emoji:"🔥", label:"action hero", tone:"amber" },
  Mercury:{ emoji:"🧠", label:"big brain", tone:"violet" },
  Jupiter:{ emoji:"🍀", label:"lucky growth", tone:"emerald" },
  Venus:{ emoji:"💞", label:"aesthetic main", tone:"emerald" },
  Saturn:{ emoji:"⏳", label:"discipline buff", tone:"violet" },
  Rahu:{ emoji:"☊", label:"edge seeker", tone:"amber" },
  Ketu:{ emoji:"☋", label:"inner compass", tone:"violet" },
};
function renderPlanetSticker(id: PlanetId, score: number) {
  if (score < 0.7) return null;
  const s = PLANET_STICKERS[id];
  if (!s) return null;
  return <StickerTag tone={s.tone ?? "emerald"}>{s.emoji} {s.label}</StickerTag>;
}

/* ---------- Cards (summary-first; details in Spotlight) ---------- */
function PlanetCard({
  p,
  onOpen,
  weakTip,
  oneLiner,
}: {
  p: ExtractedPlanet;
  onOpen: (id: PlanetId) => void;
  weakTip?: string;
  oneLiner: React.ReactNode;
}) {
  const boss = isBoss(p.normalized.total);
  const Wrapper = boss ? BossHouseCard : NonBossHouseCard;

  return (
    <Wrapper>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-heading text-base leading-tight">{p.id}</h3>
          <div className="mt-1 flex flex-wrap gap-2">{p.theme.map((t) => <Pill key={t}>{t}</Pill>)}</div>
        </div>
        <AnimatedScaleBadge value={p.normalized.total} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="flex items-center justify-center">
          <StrengthRing value={p.normalized.total} boss={boss} />
        </div>
        <div className="text-sm opacity-90">
          {oneLiner}
        </div>
      </div>

      {p.normalized.total < 0.4 && (
        <div className="mt-3">
          <QuestCallout text={weakTip ?? "Low-battery planet — pick one tiny support action."} />
        </div>
      )}

      <div className="mt-3">
        <Button size="sm" variant="secondary" onClick={() => onOpen(p.id)}>
          View Spotlight
        </Button>
      </div>
    </Wrapper>
  );
}

/* ---------- Quick Reads ---------- */
function QuickReadsRailPlanets({
  ranking,
  get,
  tutorMode,
}: {
  ranking: PlanetId[];
  get: (id: PlanetId) => ExtractedPlanet | undefined;
  tutorMode: boolean;
}) {
  const top = ranking.slice(0, 3).map(get).filter(Boolean) as ExtractedPlanet[];
  if (top.length === 0) {
    return (
      <QuickRail>
        <QuickCard title="Quick Reads" subtitle="Data unavailable right now." score={0} />
      </QuickRail>
    );
  }
  return (
    <QuickRail>
      {top.map((p, idx) => (
        <WiggleOnMount key={p.id} delay={idx * 0.05}>
          <QuickCard
            title={`Strong focus: ${p.id}`}
            subtitle={tutorMode ? (
              <>High normalized total for <span className="font-medium">{p.id}</span>. Favor activity linked to its karakas.</>
            ) : (
              <>{wittyPlanetLine(p.id, p.normalized.total)}</>
            )}
            score={p.normalized.total}
          />
        </WiggleOnMount>
      ))}
    </QuickRail>
  );
}

function QuickReadsPlanetPairs({ get }: { get: (id: PlanetId) => ExtractedPlanet | undefined }) {
  const sun = get("Sun"), moon = get("Moon");
  const mars = get("Mars"), venus = get("Venus");
  const mercury = get("Mercury"), jupiter = get("Jupiter");

  const pairs = [
    { a: sun, b: moon, label: "Sun ↔ Moon" },
    { a: mars, b: venus, label: "Mars ↔ Venus" },
    { a: mercury, b: jupiter, label: "Mercury ↔ Jupiter" },
  ].filter(p => p.a && p.b) as { a: ExtractedPlanet; b: ExtractedPlanet; label: string }[];

  if (pairs.length === 0) {
    return (
      <QuickRail>
        <QuickCard title="Axis comparisons" subtitle="Some planets are missing — comparisons unavailable." score={0} />
      </QuickRail>
    );
  }

  return (
    <QuickRail>
      {pairs.map((p, idx) => {
        const text = p.a.normalized.total === p.b.normalized.total
          ? <>Balanced — comparable right now.</>
          : p.a.normalized.total > p.b.normalized.total
            ? <><span className="font-medium">{p.a.id}</span> is more charged than {p.b.id}.</>
            : <><span className="font-medium">{p.b.id}</span> outpowers {p.a.id}.</>;
        return (
          <WiggleOnMount key={p.label} delay={idx * 0.05}>
            <QuickCard title={p.label} subtitle={text as any} score={Math.max(p.a.normalized.total, p.b.normalized.total)} />
          </WiggleOnMount>
        );
      })}
    </QuickRail>
  );
}

/* ---------- Spotlight ---------- */
function ShadbalaSpotlight({
  p,
  open,
  onClose,
  classicalOn,
  sparkle,
  sparkleKey,
  shareLiteText,
}: {
  p?: ExtractedPlanet;
  open: boolean;
  onClose: () => void;
  classicalOn: boolean;
  sparkle: boolean;
  sparkleKey: number;
  shareLiteText: string;
}) {
  if (!open || !p) return null;
  const boss = isBoss(p.normalized.total);
  const panels = [
    { title: "Significance", items: [planetSignificance[p.id]] },
    { title: "If Strong", items: ifStrongPlanet[p.id] ?? [] },
    { title: "If Weak", items: ifWeakPlanet[p.id] ?? [] },
  ];

  return (
    <Spotlight
      open={open}
      onClose={onClose}
      title={
        <div>
          <div>{p.id}</div>
          {(() => {
            const sticker = renderPlanetSticker(p.id, p.normalized.total);
            return sticker ? <div className="mt-1">{sticker}</div> : null;
          })()}
        </div>
      }
      badgeValue={p.normalized.total}
      ring={
        <>
          <StrengthRing value={p.normalized.total} boss={boss} />
          <div className="text-xs text-dim">
            Normalized total <span className="font-mono">{p.normalized.total.toFixed(2)}</span>
          </div>
        </>
      }
      bars={
        <>
          {(["sthana","dig","kala","cheshta","naisargika","drik"] as PillarKey[]).map((k) => (
            <PillarBar
              key={k}
              label={classicalOn ? PILLAR_LABELS[k].classical : PILLAR_LABELS[k].genz}
              value={p.normalized[k] ?? 0}
              tooltip={PILLAR_LABELS[k].hint}
              classical={
                classicalOn
                  ? {
                      virupa: p.classical?.components?.virupa?.[k],
                      rupa: p.classical?.components?.rupa?.[k],
                    }
                  : undefined
              }
            />
          ))}
          {classicalOn && (
            <div className="mt-2 text-xs text-dim">
              Classical total: <span className="font-mono">{Math.round(p.classical?.virupa ?? 0)} v</span> •{" "}
              <span className="font-mono">{(p.classical?.rupa ?? 0).toFixed(2)} r</span>
              {p.classical?.tier ? <span> • {p.classical.tier}</span> : null}
            </div>
          )}

          <div className="mt-3">
            <Accordion>
              {panels.map((panel, idx) => (
                <AccordionItem key={panel.title} title={panel.title} defaultOpen={idx === 0}>
                  {panel.items?.length ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {panel.items.map((line: string, i: number) => (
                        <li key={i}
                            className={panel.title === "If Strong" ? "text-emerald-200/90" : panel.title === "If Weak" ? "text-rose-200/90" : ""}>
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-dim">No notes available.</div>
                  )}
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </>
      }
      footer={
        <div className="relative">
          <Sparkles show={sparkle} burstKey={sparkleKey} />
          <div className="relative z-10 flex items-center justify-between gap-3 print-hidden">
            <div className="flex items-center gap-2">
              <ReferenceButton />
              <ShareLite text={shareLiteText} />
            </div>
            <Link href="/shadbala" className="text-xs text-dim underline decoration-white/30 hover:decoration-white/60">
              What is Shadbala? ↗
            </Link>
          </div>
        </div>
      }
    />
  );
}

/* ---------- Explain footers (planet copy) ---------- */
function Explainers() {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="ka-card p-4 ka-card-hover">
        <div className="text-white font-medium mb-1">What is Shadbala?</div>
        <div className="text-dim text-sm">
          Planet “strength” across six pillars: Sthāna, Dik, Kāla, Cheṣṭā, Naiṣargika, and Dṛk. Toggle classical to see
          virūpa/rūpa values and tiers.
        </div>
        <div className="mt-3">
          <Link href="/shadbala" className="cursor-pointer text-xs underline decoration-white/30 hover:decoration-white/60">
            Learn more ↗
          </Link>
        </div>
      </div>
      <div className="ka-card p-4 ka-card-hover">
        <div className="text-white font-medium mb-1">How it’s calculated</div>
        <div className="text-dim text-sm">
          We normalize each pillar 0–1 and average for the total; your API also provides classical virūpa/rūpa per planet.
        </div>
      </div>
      <div className="ka-card p-4 ka-card-hover">
        <div className="text-white font-medium mb-1">Reading the scale</div>
        <div className="text-dim text-sm">
          <b>≥ 0.70</b> Very strong (Boss Mode) • <b>0.55–0.69</b> Holding Steady • <b>0.40–0.54</b> Needs a Boost •{" "}
          <b>&lt; 0.40</b> Needs Support.
        </div>
      </div>
    </div>
  );
}

/* ---------- Main ---------- */
export default function Shadbala({ data }: { data: ShadbalaApi }) {
  const { planets, ranking } = useMemo(() => extractShadbala(data), [data]);
  const byId = (id: PlanetId) => planets.find((p) => p.id === id);

  const [open, setOpen] = usePersistentToggle("ka:shadbala:open", true);
  const [classicalOn, setClassicalOn] = usePersistentToggle("ka:shadbala:classical", false);
  const [wheelView, setWheelView] = usePersistentToggle("ka:shadbala:view:wheel", true);
  const [tutorMode, setTutorMode] = usePersistentToggle("ka:shadbala:tutor", false);

  const { show: showNudge, dismiss: dismissNudge } = useOneTimeNudge("ka:shadbala:spotlight:nudge");

  const [activeId, setActiveId] = useState<PlanetId | null>(null);
  const activePlanet = activeId ? byId(activeId) : undefined;

  const haptics = useHaptics();
  const [sparkle, setSparkle] = useState(false);
  const [sparkleKey, setSparkleKey] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; text: string; emoji: string }[]>([]);

  /* ActionBar (identical grammar to Bhava) */
  const shareLiteText = useMemo(() => {
    const bosses = planets.filter((x) => x.normalized.total >= 0.7).map((x) => `${x.id} 👑`).slice(0, 3).join(", ") || "No Boss planets";
    const weaks = planets.filter((x) => x.normalized.total < 0.4).map((x) => `${x.id} 🫂`).slice(0, 3).join(", ") || "All supported";
    return `My Shadbala: Boss ${bosses} • Weak ${weaks}`;
  }, [planets]);

  const actions = (
    <ResponsiveActionBar>
      {/* Critical: always visible */}
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5">
        <span className="inline-flex items-center gap-1">
          <PanelsTopLeft className="size-3.5" />
          <span className="hidden sm:inline">Wheel</span>
        </span>
        <Switch checked={wheelView} onCheckedChange={setWheelView} />
      </div>

      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5">
        <span className="inline-flex items-center gap-1">
          <Eye className="size-3.5" />
          <span className="hidden sm:inline">Classical</span>
        </span>
        <Switch checked={classicalOn} onCheckedChange={setClassicalOn} />
      </div>

      <Button
        size="sm"
        variant="secondary"
        className="bg-white/10 text-white hover:bg-white/20 text-xs px-3 py-1.5"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Hide section" : "Show section"}
      >
        {open ? (
          <>
            <ChevronDown className="mr-1 size-4" />
            <span className="hidden sm:inline">Hide</span>
          </>
        ) : (
          <>
            <ChevronRight className="mr-1 size-4" />
            <span className="hidden sm:inline">Show</span>
          </>
        )}
      </Button>

      {/* Lower priority (collapsible) */}
      <div data-collapsible className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5">
        <span className="inline-flex items-center gap-1"><span className="size-3.5 inline-block">🎓</span><span className="hidden sm:inline">Tutor</span></span>
        <Switch checked={tutorMode} onCheckedChange={setTutorMode} />
      </div>

      <Link data-collapsible href="/shadbala" className="cursor-pointer text-xs rounded-xl border border-white/10 px-3 py-1.5 hover:bg-white/5 text-white/80 inline-flex items-center gap-1" aria-label="Learn Shadbala">
        <HelpCircle className="size-3.5" />
        <span className="hidden sm:inline">Learn</span>
      </Link>

      <div data-collapsible><ReferenceButton /></div>
      <div data-collapsible><PrintButton /></div>
    </ResponsiveActionBar>
  );

  /* Selection handler (sparkle on Boss, like Bhava) */
  const uiPlanets = useMemo(() => planets.map(p => ({ id: p.id, total: p.normalized.total })), [planets]);
  const handleSelect = useCallback((id: PlanetId) => {
    setActiveId(id);
    const sel = planets.find((x) => x.id === id);
    const isBossSel = !!sel && sel.normalized.total >= 0.7;
    setSparkle(isBossSel);
    if (isBossSel) { setSparkleKey((k) => k + 1); haptics.light(); }
    dismissNudge();
  }, [planets, haptics, dismissNudge]);

  /* Weak tips (quests) */
  const weakTips = useMemo(() => weakPlanetQuests(uiPlanets), [uiPlanets]);

  /* Boss/Weak badges */
  const bossBadges = planets.filter((x) => x.normalized.total >= 0.7)
    .map((x) => ({ id: x.id, label: `Boss ${x.id}`, kind: "boss" as const }));
  const weakBadges = planets.filter((x) => x.normalized.total < 0.4)
    .map((x) => ({ id: x.id, label: `Weak ${x.id}`, kind: "weak" as const }));
  const badgeFeed = [...bossBadges, ...weakBadges];

  /* Axis badge stories (Sun↔Moon, etc.) */
  const axisPairs = useMemo(() => {
    const safe = (a?: ExtractedPlanet, b?: ExtractedPlanet, label: string) => {
      if (!a || !b) return { label: `${label} — data missing`, tie: true as const };
      if (a.normalized.total === b.normalized.total) return { label: `${label} Balanced`, tie: true as const };
      return a.normalized.total > b.normalized.total
        ? { label, winner: `${a.id}` }
        : { label, winner: `${b.id}` };
    };
    return [safe(byId("Sun"), byId("Moon"), "Sun↔Moon"), safe(byId("Mars"), byId("Venus"), "Mars↔Venus"), safe(byId("Mercury"), byId("Jupiter"), "Mercury↔Jupiter")];
  }, [planets]); // byId derives from planets

  /* Achievements toasts (dedup like Bhava) */
  useEffect(() => {
    const ach = detectPlanetAchievements(uiPlanets);
    const next = ach.map((a, i) => ({
      id: a.key + ":" + ((a as any).planet ?? String(i)),
      text: a.label,
      emoji: a.emoji,
    }));
    setToasts((prev) => {
      if (prev.length === next.length && prev.every((p, i) => p.id === next[i].id && p.text === next[i].text && p.emoji === next[i].emoji)) {
        return prev; // no change → no render → no loop
      }
      return next;
    });
  }, [uiPlanets]);

  return (
    <SectionShell
      id="shadbala"
      title="Shadbala (Planet Strength)"
      subtitle={<span className="opacity-80">Normalized scores with classical toggle</span>}
      collapsible
      defaultOpen
      open={!!open}
      actions={actions}
    >
      {/* Fun fact chip */}
      <div className="-mx-2 px-2 md:mx-0 md:px-0 mt-2 print-hidden">
        <FunFactChip
          facts={[
            "Saturn strong → routines and long-term compounding shine.",
            "Sun strong → lead visibly; generous leadership multiplies.",
            "Mercury strong → write first; ship small & iterate.",
          ]}
          autoRotateMs={7000}
        />
      </div>

      {/* Quick Reads */}
      <div className="text-sm font-semibold mb-2 mt-5">Quick Reads</div>
      <QuickReadsRailPlanets ranking={ranking} get={byId as any} tutorMode={tutorMode} />
      <QuickReadsPlanetPairs get={byId as any} />

      {/* Passive recognition badges */}
      <div className="mt-3 print-hidden">
        <BossWeakBadgeFeed items={badgeFeed} />
      </div>

      {/* Axis badge stories */}
      <div className="mt-3">
        <AxisBadgeStories pairs={axisPairs} />
      </div>

      {/* Wheel / Cards */}
      {wheelView ? (
        <div className="mt-2">
          <SpokeWheel
            count={planets.length}
            values={planets.map((p) => p.normalized.total)}
            onSelect={(i) => handleSelect(planets[i].id)}
            fillForIndex={(i, v) =>
              bucket(v) === "boss"
                ? "fill-emerald-400/15"
                : bucket(v) === "steady"
                  ? "fill-violet-400/15"
                  : bucket(v) === "boost"
                    ? "fill-amber-400/15"
                    : "fill-rose-400/15"
            }
            labelForIndex={(i) => planets[i].id}
          />
          {showNudge && <div className="mt-2 text-center text-sm text-dim">Tap a planet for Spotlight ↗</div>}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:overflow-visible">
          {planets.map((p) => (
            <div key={p.id} className="w-[300px] sm:w-auto shrink-0 sm:shrink min-w-[300px] sm:min-w-0">
              <div className="p-[1px]">
                <PlanetCard
                  p={p}
                  oneLiner={tutorMode ? <>Shows {Math.round(p.normalized.total * 100)}% strength. Align with its karakas.</> : wittyPlanetLine(p.id, p.normalized.total)}
                  weakTip={weakTips[p.id]}
                  onOpen={handleSelect as any}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explain footers */}
      <Explainers />

      {/* Spotlight */}
      <ShadbalaSpotlight
        p={activePlanet}
        open={!!activeId}
        onClose={() => setActiveId(null)}
        classicalOn={!!classicalOn}
        sparkle={sparkle}
        sparkleKey={sparkleKey}
        shareLiteText={shareLiteText}
      />

      {/* Achievements */}
      {toasts.map((t) => (
        <AchievementToast key={t.id} text={t.text} emoji={t.emoji} onClose={() => setToasts((s) => s.filter((x) => x.id !== t.id))} />
      ))}
    </SectionShell>
  );
}