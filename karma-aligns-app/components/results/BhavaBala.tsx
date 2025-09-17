"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, HelpCircle, Eye, PanelsTopLeft } from "lucide-react";

import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import StrengthRing from "@/components/ui/StrengthRing";
// import ScaleBadge from "@/components/ui/ScaleBadge"; // replaced by AnimatedScaleBadge
import BossHouseCard from "@/components/ui/BossHouseCard";
import NonBossHouseCard from "@/components/ui/NonBossHouseCard";
import Pill from "@/components/ui/Pill";
import PillarBar from "@/components/ui/PillarBar";

import QuickRail from "@/components/ui/QuickRail";
import QuickCard from "@/components/ui/QuickCard";
import SpokeWheel from "@/components/ui/SpokeWheel";
import Spotlight from "@/components/ui/Spotlight";
import SectionShell from "@/components/ui/SectionShell";
import ActionBar from "@/components/ui/ActionBar";

import usePersistentToggle from "@/components/hooks/usePersistentToggle";
import useOneTimeNudge from "@/components/hooks/useOneTimeNudge";
import useInView from "@/components/hooks/useInView";

import { bucket, isBoss } from "@/components/tokens/scales";
import { HOUSE_THEMES, HOUSE_NAMES, significanceLines, whatIfStrong, whatIfWeak } from "@/components/tokens/Bhava";

import AnimatedScaleBadge from "@/components/ui/AnimatedScaleBadge";
import Sparkles from "@/components/effects/Sparkles";
import useHaptics from "@/components/hooks/useHaptics";
import AchievementToast from "@/components/achievements/AchievementToast";
import QuestCallout from "@/components/ui/QuestCallout";
import { detectAchievements, weakHouseQuests } from "@/components/utils/bhavaAchievements";
import { wittyHouseLine, emojiForBucket } from "@/components/copy/genz";
import FunFactChip from "@/components/ui/FunFactChip";

import StickerTag from "@/components/ui/StickerTag";
import VirupaByGrahaTable from "@/components/classical/VirupaByGrahaTable";
import ReferenceButton from "@/components/classical/ReferenceButton";
import PrintButton from "@/components/ui/PrintButton";
import WiggleOnMount from "@/components/motion/WiggleOnMount";

// ---------- Types ----------
type LegacyCount = { house: number; benefics: number; malefics: number; net: number };
type NormalizedHouse = { bhava_drik: number; kendradhi: number };
type VirupaRupaHouse = {
  components: { virupa: Record<string, number>; rupa: Record<string, number> };
  totals: { virupa: number; rupa: number };
};
type BhavaBalaApi = {
  bhava_bala: {
    legacy_counts: LegacyCount[];
    normalized: Record<string, NormalizedHouse>;
    virupa_rupa?: Record<string, VirupaRupaHouse>;
    totals?: { virupa?: Record<string, number>; rupa?: Record<string, number>; tier?: Record<string, string> };
  };
};
type ExtractedHouse = {
  id: number;
  normalized: { total: number; bhava_drik: number; kendradhi: number };
  classical?: { virupa: number; rupa: number; tier?: string; components?: { virupa: Record<string, number>; rupa: Record<string, number> } };
  legacy: LegacyCount;
  theme: string[];
};

// ---------- Helpers ----------
const clamp01 = (n: number) => Math.max(0, Math.min(1, n ?? 0));
const totalNormalized = (n: NormalizedHouse) => clamp01((n.bhava_drik + n.kendradhi) / 2);

function extractBhavaBala(data: BhavaBalaApi) {
  const legacyById: Record<number, LegacyCount> = {};
  data.bhava_bala.legacy_counts.forEach((c) => (legacyById[c.house] = c));

  const houses: ExtractedHouse[] = Array.from({ length: 12 }, (_, i) => {
    const id = i + 1;
    const n = data.bhava_bala.normalized[String(id)] ?? { bhava_drik: 0, kendradhi: 0 };
    const vr = data.bhava_bala.virupa_rupa?.[String(id)];
    const totals = data.bhava_bala.totals ?? {};

    return {
      id,
      normalized: {
        bhava_drik: clamp01(n.bhava_drik),
        kendradhi: clamp01(n.kendradhi),
        total: totalNormalized(n),
      },
      classical: vr
        ? {
          virupa: Math.round(vr.totals.virupa ?? 0),
          rupa: Number((vr.totals.rupa ?? 0).toFixed(2)),
          tier: totals.tier?.[String(id)],
          components: vr.components,
        }
        : totals?.rupa || totals?.virupa
          ? {
            virupa: Math.round(totals.virupa?.[String(id)] ?? 0),
            rupa: Number((totals.rupa?.[String(id)] ?? 0).toFixed(2)),
            tier: totals.tier?.[String(id)],
          }
          : undefined,
      legacy: legacyById[id] ?? { house: id, benefics: 0, malefics: 0, net: 0 },
      theme: HOUSE_THEMES[id] ?? [],
    };
  });

  const ranking = [...houses]
    .sort((a, b) =>
      b.normalized.total === a.normalized.total
        ? (b.classical?.rupa ?? 0) - (a.classical?.rupa ?? 0)
        : b.normalized.total - a.normalized.total
    )
    .map((h) => h.id);

  return { houses, ranking };
}

function pillarLabel(key: "bhava_drik" | "kendradhi", classicalOn: boolean) {
  if (classicalOn) return key === "bhava_drik" ? "Bhāva Drik" : "Kendradhi";
  return key === "bhava_drik" ? "Support Power" : "Placement Power";
}

// ---------- Cards ----------
function HouseCard({
  h,
  classicalOn,
  onOpen,
  uiHouses,
}: {
  h: ExtractedHouse;
  classicalOn: boolean;
  onOpen: (id: number) => void;
  uiHouses: { id: number; total: number }[];
}) {
  const { ref } = useInView<HTMLDivElement>();
  const boss = isBoss(h.normalized.total);
  const Wrapper = boss ? BossHouseCard : NonBossHouseCard;

  return (
    <Wrapper ref={ref}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-heading text-base leading-tight">House {h.id}</h3>
          <div className="text-[12px] text-dim">{HOUSE_NAMES[h.id]}</div>
        </div>
        {/* animated badge (keeps ScaleBadge visuals, just adds a one-time pop for Boss) */}
        <AnimatedScaleBadge value={h.normalized.total} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="flex items-center justify-center">
          <StrengthRing value={h.normalized.total} boss={boss} />
        </div>
        <div>
          <PillarBar
            label={pillarLabel("bhava_drik", classicalOn)}
            value={h.normalized.bhava_drik}
            tooltip="Bhāva Drik — aspects lending support to this house."
            classical={
              classicalOn
                ? { virupa: h.classical?.components?.virupa?.bhava_drik, rupa: h.classical?.components?.rupa?.bhava_drik }
                : undefined
            }
          />
          <PillarBar
            label={pillarLabel("kendradhi", classicalOn)}
            value={h.normalized.kendradhi}
            tooltip="Kendradhi — positional advantage (Kendra/Panaphara/Apoklima)."
            classical={
              classicalOn
                ? { virupa: h.classical?.components?.virupa?.kendradhi, rupa: h.classical?.components?.rupa?.kendradhi }
                : undefined
            }
          />
          {classicalOn && (
            <div className="mt-2 text-xs text-dim">
              Classical total: <span className="font-mono">{Math.round(h.classical?.virupa ?? 0)} v</span> •{" "}
              <span className="font-mono">{(h.classical?.rupa ?? 0).toFixed(2)} r</span>
              {h.classical?.tier ? <span> • {h.classical.tier}</span> : null}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {h.theme.map((t) => (
          <Pill key={t}>{t}</Pill>
        ))}
      </div>

      <div className="mt-3">
        <Button size="sm" variant="secondary" onClick={() => onOpen(h.id)}>
          View Spotlight
        </Button>
      </div>

      {/* weak-house micro-quest (inside card, preserves layout) */}
      {h.normalized.total < 0.4 && (
        <QuestCallout
          text={
            weakHouseQuests(uiHouses).find((q) => q.house === h.id)?.tip ??
            "Low-battery area — pick one tiny support action."
          }
        />
      )}
    </Wrapper>
  );
}

// ---------- Quick Reads ----------
function QuickReadsRail({
  ranking,
  get,
  tutorMode,
}: {
  ranking: number[];
  get: (id: number) => ExtractedHouse | undefined;
  tutorMode: boolean;
}) {
  const top = ranking.slice(0, 3).map((id) => get(id)!);
  return (
    <QuickRail>
      {top.map((h, idx) => (
        <WiggleOnMount key={h.id} delay={idx * 0.05}>
          <QuickCard
            title={`Strong focus: House ${h.id}`}
            subtitle={
              tutorMode ? (
                <>
                  High normalized total for <span className="font-medium">{HOUSE_NAMES[h.id]}</span>. Favor activity in
                  this life area.
                </>
              ) : (
                <>
                  {wittyHouseLine(h.id, h.normalized.total >= 0.7)}{" "}
                  <span className="opacity-80">
                    {emojiForBucket[bucket(h.normalized.total) as keyof typeof emojiForBucket]}
                  </span>
                </>
              )
            }
            score={h.normalized.total}
          />
        </WiggleOnMount>
      ))}
    </QuickRail>
  );
}

function QuickReadsBhava({
  get,
}: {
  get: (id: number) => ExtractedHouse | undefined;
}) {
  const h1 = get(1)!, h7 = get(7)!, h4 = get(4)!, h10 = get(10)!, h5 = get(5)!, h11 = get(11)!;
  const pairs = [
    {
      label: "Self vs Partnerships (1↔7)",
      text:
        h1.normalized.total === h7.normalized.total ? (
          <>Balanced — comparable right now.</>
        ) : h1.normalized.total > h7.normalized.total ? (
          <>
            <span className="font-medium">{HOUSE_NAMES[h1.id]}</span> is more charged than {HOUSE_NAMES[h7.id]}.
          </>
        ) : (
          <>
            <span className="font-medium">{HOUSE_NAMES[h7.id]}</span> outpowers {HOUSE_NAMES[h1.id]}.
          </>
        ),
      score: Math.max(h1.normalized.total, h7.normalized.total),
    },
    {
      label: "Home vs Career (4↔10)",
      text:
        h4.normalized.total === h10.normalized.total ? (
          <>Balanced — comparable right now.</>
        ) : h4.normalized.total > h10.normalized.total ? (
          <>
            <span className="font-medium">{HOUSE_NAMES[h4.id]}</span> is more charged than {HOUSE_NAMES[h10.id]}.
          </>
        ) : (
          <>
            <span className="font-medium">{HOUSE_NAMES[h10.id]}</span> outpowers {HOUSE_NAMES[h4.id]}.
          </>
        ),
      score: Math.max(h4.normalized.total, h10.normalized.total),
    },
    {
      label: "Creativity vs Gains (5↔11)",
      text:
        h5.normalized.total === h11.normalized.total ? (
          <>Balanced — comparable right now.</>
        ) : h5.normalized.total > h11.normalized.total ? (
          <>
            <span className="font-medium">{HOUSE_NAMES[h5.id]}</span> is more charged than {HOUSE_NAMES[h11.id]}.
          </>
        ) : (
          <>
            <span className="font-medium">{HOUSE_NAMES[h11.id]}</span> outpowers {HOUSE_NAMES[h5.id]}.
          </>
        ),
      score: Math.max(h5.normalized.total, h11.normalized.total),
    },
  ];

  return (
    <QuickRail>
      {pairs.map((p, idx) => (
        <WiggleOnMount key={p.label} delay={idx * 0.05}>
          <QuickCard title={p.label} subtitle={p.text} score={p.score} />
        </WiggleOnMount>
      ))}
    </QuickRail>
  );
}

// ---------- Spotlight ----------
// --- Boss stickers (inline helper) ---
type StickerTone = "emerald" | "violet" | "rose" | "amber";

const HOUSE_STICKERS: Record<
  number,
  { emoji: string; label: string; tone?: StickerTone }
> = {
  1: { emoji: "🌟", label: "main-character mode", tone: "emerald" },
  2: { emoji: "💸", label: "money talks", tone: "emerald" },
  3: { emoji: "🛠️", label: "skill grindset", tone: "violet" },
  4: { emoji: "🏡", label: "cozy core", tone: "violet" },
  5: { emoji: "🎨", label: "muse mode", tone: "emerald" },
  6: { emoji: "🫀", label: "health hustle", tone: "amber" },
  7: { emoji: "💌", label: "collab queen", tone: "emerald" },
  8: { emoji: "🌀", label: "plot twist energy", tone: "rose" },
  9: { emoji: "🍀", label: "lucky learner", tone: "emerald" },
  10: { emoji: "📈", label: "career glow-up", tone: "emerald" },
  11: { emoji: "🌐", label: "network effect", tone: "violet" },
  12: { emoji: "😴", label: "recharge mode", tone: "violet" },
};

function renderHouseSticker(id: number, score: number) {
  if (score < 0.70) return null; 
  const s = HOUSE_STICKERS[id];
  if (!s) return null;
  return <StickerTag tone={s.tone ?? "emerald"}>{s.emoji} {s.label}</StickerTag>;
}

function BhavaSpotlight({
  h,
  open,
  onClose,
  classicalOn,
  sparkle,
  sparkleKey,
}: {
  h?: ExtractedHouse;
  open: boolean;
  onClose: () => void;
  classicalOn: boolean;
  sparkle: boolean;
  sparkleKey: number;
}) {
  if (!open || !h) return null;
  const boss = isBoss(h.normalized.total);
  const panels = [
    { title: "Significance", items: significanceLines(h.id, h.theme) },
    { title: "If Strong", items: whatIfStrong(h.id), tone: "good" as const },
    { title: "If Weak", items: whatIfWeak(h.id), tone: "bad" as const },
  ];

  return (
    <Spotlight
      open={open}
      onClose={onClose}
      title={
        <div>
          <div>#{h.id} — {HOUSE_NAMES[h.id]}</div>
          {(() => {
            const sticker = renderHouseSticker(h.id, h.normalized.total);
            return sticker ? <div className="mt-1">{sticker}</div> : null;
          })()}
        </div>
      }
      badgeValue={h.normalized.total}
      ring={
        <>
          <StrengthRing value={h.normalized.total} boss={boss} />
          <div className="text-xs text-dim">
            Normalized total <span className="font-mono">{h.normalized.total.toFixed(2)}</span>
          </div>
        </>
      }
      bars={
        <>
          <PillarBar
            label={pillarLabel("bhava_drik", classicalOn)}
            value={h.normalized.bhava_drik}
            tooltip="Bhāva Drik — aspects lending support to this house."
            classical={
              classicalOn
                ? { virupa: h.classical?.components?.virupa?.bhava_drik, rupa: h.classical?.components?.rupa?.bhava_drik }
                : undefined
            }
          />
          <PillarBar
            label={pillarLabel("kendradhi", classicalOn)}
            value={h.normalized.kendradhi}
            tooltip="Kendradhi — positional advantage (Kendra/Panaphara/Apoklima)."
            classical={
              classicalOn
                ? { virupa: h.classical?.components?.virupa?.kendradhi, rupa: h.classical?.components?.rupa?.kendradhi }
                : undefined
            }
          />
          {classicalOn && (
            <div className="mt-2 text-xs text-dim">
              Classical total: <span className="font-mono">{Math.round(h.classical?.virupa ?? 0)} v</span> •{" "}
              <span className="font-mono">{(h.classical?.rupa ?? 0).toFixed(2)} r</span>
              {h.classical?.tier ? <span> • {h.classical.tier}</span> : null}
            </div>
          )}

          {/* Classical drill-down (optional) */}
          {classicalOn && (
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Virūpa by Graha</div>
              <VirupaByGrahaTable
                rows={
                  h.classical?.components && (h.classical.components as any).virupa_by_graha
                    ? Object.entries((h.classical!.components as any).virupa_by_graha).map(
                      ([graha, virupa]: any) => ({ graha, virupa: Number(virupa || 0) })
                    )
                    : undefined
                }
              />
            </div>
          )}
        </>
      }
      panels={panels}
      footer={
        <div className="relative">
          <Sparkles show={sparkle} burstKey={sparkleKey} />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <ReferenceButton />
            <Link href="/bhavabala" className="text-xs text-dim underline decoration-white/30 hover:decoration-white/60">
              What is Bhava Bala? ↗
            </Link>
          </div>
        </div>
      }
    />
  );
}

// ---------- Explain footers ----------
function Explainers() {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="ka-card p-4 ka-card-hover">
        <div className="text-white font-medium mb-1">What is Bhava Bala?</div>
        <div className="text-dim text-sm">
          Quick read on how “charged” each house is. Each house = a room in your life; this shows the room’s power.
        </div>
        <div className="mt-3">
          <Link href="/bhavabala" className="cursor-pointer text-xs underline decoration-white/30 hover:decoration-white/60">
            Learn more ↗
          </Link>
        </div>
      </div>
      <div className="ka-card p-4 ka-card-hover">
        <div className="text-white font-medium mb-1">How it’s calculated</div>
        <div className="text-dim text-sm">
          We blend <b>Support Power</b> (Bhāva Drik — aspect help) and <b>Placement Power</b> (Kendradhi — positional advantage).
          Scores are normalized 0–1; toggle classical to see virūpa/rūpa.
        </div>
      </div>
      <div className="ka-card p-4 ka-card-hover">
        <div className="text-white font-medium mb-1">Reading the scale</div>
        <div className="text-dim text-sm">
          <b>≥ 0.70</b> Very strong (Boss Mode) • <b>0.55–0.69</b> Holding Steady • <b>0.40–0.54</b> Needs a Boost • <b>&lt; 0.40</b> Needs Support.
        </div>
      </div>
    </div>
  );
}

// ---------- Main ----------
export default function BhavaBala({ data }: { data: BhavaBalaApi }) {
  const { houses, ranking } = useMemo(() => extractBhavaBala(data), [data]);
  const byId = (id: number) => houses.find((h) => h.id === id);

  const [open, setOpen] = usePersistentToggle("ka:bhava:open", true);
  const [classicalOn, setClassicalOn] = usePersistentToggle("ka:bhava:classical", false);
  const [wheelView, setWheelView] = usePersistentToggle("ka:bhava:view:wheel", true);
  const [tutorMode, setTutorMode] = usePersistentToggle("ka:bhava:tutor", false); // ✅ moved inside component

  const { show: showNudge, dismiss: dismissNudge } = useOneTimeNudge("ka:bhava:spotlight:nudge");

  const [activeId, setActiveId] = useState<number | null>(null);
  const activeHouse = activeId ? byId(activeId) : undefined;

  const haptics = useHaptics();
  const [sparkle, setSparkle] = useState(false);
  const [sparkleKey, setSparkleKey] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; text: string; emoji: string }[]>([]);
  const uiHouses = houses.map((h) => ({ id: h.id, total: h.normalized.total }));

  useEffect(() => {
    const ach = detectAchievements(uiHouses);
    setToasts(ach.map((a, i) => ({ id: a.key + ":" + ((a as any).house ?? String(i)), text: a.label, emoji: a.emoji })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SectionShell
      id="bhavabala"
      title="Bhava Bala (House Strength)"
      open={!!open}
      actions={
        <ActionBar>
          {/* Wheel toggle */}
          <div className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5">
            <span className="inline-flex items-center gap-1">
              <PanelsTopLeft className="size-3.5" />
              <span className="hidden sm:inline">Wheel</span>
            </span>
            <Switch checked={wheelView} onCheckedChange={setWheelView} />
          </div>

          {/* Classical toggle */}
          <div className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5">
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">Classical</span>
            </span>
            <Switch checked={classicalOn} onCheckedChange={setClassicalOn} />
          </div>

          {/* Learn link */}
          <Link
            href="/bhavabala"
            className="cursor-pointer shrink-0 text-xs rounded-xl border border-white/10 px-3 py-1.5 hover:bg-white/5 text-white/80 inline-flex items-center gap-1"
            aria-label="Learn Bhava Bala"
          >
            <HelpCircle className="size-3.5" />
            <span className="hidden sm:inline">Learn</span>
          </Link>

          {/* Show/Hide */}
          <Button
            size="sm"
            variant="secondary"
            className="shrink-0 bg-white/10 text-white hover:bg-white/20 text-xs px-3 py-1.5"
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

          {/* Tutor toggle */}
          <div className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5">
            <span className="inline-flex items-center gap-1">
              <span className="size-3.5 inline-block">🎓</span>
              <span className="hidden sm:inline">Tutor</span>
            </span>
            <Switch checked={tutorMode} onCheckedChange={setTutorMode} />
          </div>

          <ReferenceButton />
          <PrintButton />
        </ActionBar>
      }
    >
      {/* Fun fact — full-width, below the header controls, never overflows */}
      <div className="-mx-2 px-2 md:mx-0 md:px-0 mt-2">
        <FunFactChip
          facts={[
            "Did you know House 7 = collabs? Strong house → team projects sparkle ✨",
            "House 10 lights up career, reputation, goals.",
            "House 12 low → protect sleep & boundaries.",
          ]}
        />
      </div>

      {/* Quick Reads */}
      <div className="text-sm font-semibold mb-2 mt-5">Quick Reads</div>
      <QuickReadsRail ranking={ranking} get={byId as any} tutorMode={tutorMode} />
      <QuickReadsBhava get={byId as any} />

      {/* Wheel / Cards */}
      {wheelView ? (
        <div className="mt-2">
          <SpokeWheel
            count={12}
            values={houses.map((h) => h.normalized.total)}
            onSelect={(id) => {
              setActiveId(id);
              const sel = houses.find((x) => x.id === id)!;
              const isBossSel = sel?.normalized.total >= 0.7;
              setSparkle(isBossSel);
              if (isBossSel) {
                setSparkleKey((k) => k + 1);
                haptics.light();
              }
              dismissNudge();
            }}
            fillForIndex={(i, v) =>
              bucket(v) === "boss"
                ? "fill-emerald-400/15"
                : bucket(v) === "steady"
                  ? "fill-violet-400/15"
                  : bucket(v) === "boost"
                    ? "fill-amber-400/15"
                    : "fill-rose-400/15"
            }
            labelForIndex={(i) => i + 1}
          />
          {showNudge && <div className="mt-2 text-center text-sm text-dim">Tap a house for Spotlight ↗</div>}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 sm:overflow-visible">
          {houses.map((h) => (
            <div key={h.id} className="w-[300px] sm:w-auto shrink-0 sm:shrink min-w-[300px] sm:min-w-0">
              <div className="p-[1px]">
                <HouseCard
                  h={h}
                  classicalOn={!!classicalOn}
                  uiHouses={uiHouses}
                  onOpen={(id) => {
                    setActiveId(id);
                    const sel = houses.find((x) => x.id === id)!;
                    const isBossSel = sel?.normalized.total >= 0.7;
                    setSparkle(isBossSel);
                    if (isBossSel) {
                      setSparkleKey((k) => k + 1);
                      haptics.light();
                    }
                    dismissNudge();
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Explain footers */}
      <Explainers />

      {/* Spotlight */}
      <BhavaSpotlight
        h={activeHouse}
        open={!!activeId}
        onClose={() => setActiveId(null)}
        classicalOn={!!classicalOn}
        sparkle={sparkle}
        sparkleKey={sparkleKey}
      />

      {/* Achievements */}
      {toasts.map((t) => (
        <AchievementToast
          key={t.id}
          text={t.text}
          emoji={t.emoji}
          onClose={() => setToasts((s) => s.filter((x) => x.id !== t.id))}
        />
      ))}
    </SectionShell>
  );
}
