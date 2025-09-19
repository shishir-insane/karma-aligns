"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, HelpCircle, Eye, PanelsTopLeft } from "lucide-react";

/* --- UI --- */
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
import AchievementToast from "@/components/achievements/AchievementToast";
import QuestCallout from "@/components/ui/QuestCallout";
import FunFactChip from "@/components/ui/FunFactChip";
import StickerTag from "@/components/ui/StickerTag";
import VirupaByGrahaTable from "@/components/classical/VirupaByGrahaTable";
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
import useInView from "@/components/hooks/useInView";
import useHaptics from "@/components/hooks/useHaptics";

/* --- Tokens/Copy/Utils --- */
import { bucket, isBoss } from "@/components/tokens/scales";
import {
  HOUSE_THEMES,
  HOUSE_NAMES,
  significanceLines,
  whatIfStrong,
  whatIfWeak,
  HOUSE_STICKERS,
  PILLAR_LABELS_HOUSE,
} from "@/components/tokens/Bhava";
import { detectAchievements, weakHouseQuests } from "@/components/utils/bhavaAchievements";
import { wittyHouseLine, emojiForBucket } from "@/components/copy/genz";

/* ---------- Types ---------- */
type LegacyCount = { house: number; benefics: number; malefics: number; net: number };
type NormalizedHouse = { bhava_drik: number; kendradhi: number };
type VirupaRupaHouse = {
  components: { virupa: Record<string, number>; rupa: Record<string, number> } & {
    // optional per-graha classical drilldown if you have it
    virupa_by_graha?: Record<string, number>;
  };
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
  classical?: {
    virupa: number;
    rupa: number;
    tier?: string;
    components?: { virupa: Record<string, number>; rupa: Record<string, number>; virupa_by_graha?: Record<string, number> };
  };
  legacy: LegacyCount;
  theme: string[];
};

/* ---------- Extractor (mirrors your style) ---------- */
const clamp01 = (n: number) => Math.max(0, Math.min(1, n ?? 0));
function extractBhavaBala(data: BhavaBalaApi) {
  const src = data.bhava_bala;
  const houses: ExtractedHouse[] = Object.keys(src.normalized)
    .map((key) => Number(key))
    .sort((a, b) => a - b)
    .map((id) => {
      const n = src.normalized[String(id)] ?? { bhava_drik: 0, kendradhi: 0 };
      const total = clamp01((n.bhava_drik + n.kendradhi) / 2);
      const vr = src.virupa_rupa?.[String(id)];
      const classical =
        vr || src.totals?.virupa || src.totals?.rupa
          ? {
              virupa: Math.round(vr?.totals?.virupa ?? src.totals?.virupa?.[String(id)] ?? 0),
              rupa: Number((vr?.totals?.rupa ?? src.totals?.rupa?.[String(id)] ?? 0).toFixed(6)),
              tier: src.totals?.tier?.[String(id)],
              components: {
                virupa: vr?.components?.virupa ?? {},
                rupa: vr?.components?.rupa ?? {},
                virupa_by_graha: vr?.components?.virupa_by_graha,
              },
            }
          : undefined;

      return {
        id,
        normalized: { total, bhava_drik: clamp01(n.bhava_drik), kendradhi: clamp01(n.kendradhi) },
        classical,
        legacy: src.legacy_counts[id - 1] ?? { house: id, benefics: 0, malefics: 0, net: 0 },
        theme: HOUSE_THEMES[id] ?? [],
      };
    });

  const ranking = [...houses]
    .sort((a, b) =>
      b.normalized.total === a.normalized.total ? (b.classical?.rupa ?? 0) - (a.classical?.rupa ?? 0) : b.normalized.total - a.normalized.total
    )
    .map((h) => h.id);

  return { houses, ranking };
}

/* ---------- Spotlight ---------- */
function BhavaSpotlight({
  h,
  open,
  onClose,
  classicalOn,
  sparkle,
  sparkleKey,
  shareLiteText,
}: {
  h?: ExtractedHouse;
  open: boolean;
  onClose: () => void;
  classicalOn: boolean;
  sparkle: boolean;
  sparkleKey: number;
  shareLiteText: string;
}) {
  if (!open || !h) return null;
  const boss = isBoss(h.normalized.total);
  const panels = [
    { title: "Significance", items: significanceLines[h.id] ?? [] },
    { title: "If Strong", items: whatIfStrong[h.id] ?? [], tone: "good" as const },
    { title: "If Weak", items: whatIfWeak[h.id] ?? [], tone: "bad" as const },
  ];

  return (
    <Spotlight
      open={open}
      onClose={onClose}
      title={
        <div>
          <div>{HOUSE_NAMES[h.id] ?? `House ${h.id}`}</div>
          {h.normalized.total >= 0.7 && HOUSE_STICKERS?.[h.id] ? (
            <div className="mt-1">
              <StickerTag tone={HOUSE_STICKERS[h.id].tone ?? "emerald"}>
                {HOUSE_STICKERS[h.id].emoji} {HOUSE_STICKERS[h.id].label}
              </StickerTag>
            </div>
          ) : null}
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
          {/* 2 pillars */}
          <PillarBar
            label={PILLAR_LABELS_HOUSE.bhava_drik[classicalOn ? "classical" : "genz"]}
            value={h.normalized.bhava_drik}
            classical={classicalOn ? { virupa: h.classical?.components?.virupa?.bhava_drik, rupa: h.classical?.components?.rupa?.bhava_drik } : undefined}
          />
          <PillarBar
            label={PILLAR_LABELS_HOUSE.kendradhi[classicalOn ? "classical" : "genz"]}
            value={h.normalized.kendradhi}
            classical={classicalOn ? { virupa: h.classical?.components?.virupa?.kendradhi, rupa: h.classical?.components?.rupa?.kendradhi } : undefined}
          />

          {/* classical totals + per-graha table */}
          {classicalOn && (
            <>
              <div className="mt-2 text-xs text-dim">
                Classical total: <span className="font-mono">{Math.round(h.classical?.virupa ?? 0)} v</span> •{" "}
                <span className="font-mono">{(h.classical?.rupa ?? 0).toFixed(2)} r</span>
                {h.classical?.tier ? <span> • {h.classical.tier}</span> : null}
              </div>

              <div className="mt-3">
                <div className="text-sm font-medium mb-1">Virūpa by Graha</div>
                <VirupaByGrahaTable
                  rows={
                    h.classical?.components?.virupa_by_graha
                      ? Object.entries(h.classical.components.virupa_by_graha).map(([graha, virupa]) => ({
                          graha,
                          virupa: Number(virupa || 0),
                        }))
                      : undefined
                  }
                />
              </div>
            </>
          )}

          {/* Panels */}
          <div className="mt-3">
            <Accordion>
              {panels.map((p, idx) => (
                <AccordionItem key={p.title} title={p.title} defaultOpen={idx === 0}>
                  <ul className="list-disc pl-4 space-y-1">
                    {p.items.map((line: string, i: number) => (
                      <li key={i} className={p.tone === "good" ? "text-emerald-200/90" : p.tone === "bad" ? "text-rose-200/90" : ""}>
                        {line}
                      </li>
                    ))}
                  </ul>
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
            <Link href="/bhavabala" className="text-xs text-dim underline decoration-white/30 hover:decoration-white/60">
              What is Bhava Bala? ↗
            </Link>
          </div>
        </div>
      }
    />
  );
}

/* ---------- Explain footers ---------- */
function Explainers() {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="ka-card p-4 ka-card-hover">
        <div className="text-white font-medium mb-1">What is Bhava Bala?</div>
        <div className="text-dim text-sm">Quick read on how “charged” each house is. Each house = a room in your life; this shows the room’s power.</div>
        <div className="mt-3">
          <Link href="/bhavabala" className="cursor-pointer text-xs underline decoration-white/30 hover:decoration-white/60">
            Learn more ↗
          </Link>
        </div>
      </div>
      <div className="ka-card p-4 ka-card-hover">
        <div className="text-white font-medium mb-1">How it’s calculated</div>
        <div className="text-dim text-sm">
          We blend <b>Support Power</b> (Bhāva Drik — aspect help) and <b>Placement Power</b> (Kendradhi — positional advantage). Scores are
          normalized 0–1; toggle classical to see virūpa/rūpa.
        </div>
      </div>
      <div className="ka-card p-4 ka-card-hover">
        <div className="text-white font-medium mb-1">Reading the scale</div>
        <div className="text-dim text-sm">
          <b>≥ 0.70</b> Very strong (Boss Mode) • <b>0.55–0.69</b> Holding Steady • <b>0.40–0.54</b> Needs a Boost • <b>&lt; 0.40</b> Needs
          Support.
        </div>
      </div>
    </div>
  );
}

/* ---------- Main ---------- */
export default function BhavaBala({ data }: { data: BhavaBalaApi }) {
  const { houses, ranking } = useMemo(() => extractBhavaBala(data), [data]);
  const byId = (id: number) => houses.find((h) => h.id === id);

  const [open, setOpen] = usePersistentToggle("ka:bhava:open", true);
  const [classicalOn, setClassicalOn] = usePersistentToggle("ka:bhava:classical", false);
  const [wheelView, setWheelView] = usePersistentToggle("ka:bhava:view:wheel", true);
  const [tutorMode, setTutorMode] = usePersistentToggle("ka:bhava:tutor", false);

  const { show: showNudge, dismiss: dismissNudge } = useOneTimeNudge("ka:bhava:spotlight:nudge");

  const [activeId, setActiveId] = useState<number | null>(null);
  const activeHouse = activeId ? byId(activeId) : undefined;

  const haptics = useHaptics();
  const [sparkle, setSparkle] = useState(false);
  const [sparkleKey, setSparkleKey] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; text: string; emoji: string }[]>([]);

  /* Action bar (Bhava-style; same as your earlier file) */
  const bossBadges = houses
    .filter((x) => x.normalized.total >= 0.7)
    .map((x) => ({ id: x.id, label: `Boss House ${x.id}`, kind: "boss" as const }));
  const weakBadges = houses
    .filter((x) => x.normalized.total < 0.4)
    .map((x) => ({ id: x.id, label: `Weak House ${x.id}`, kind: "weak" as const }));
  const badgeFeed = [...bossBadges, ...weakBadges];

  const axisPairs = useMemo(() => {
    const safe = (a?: ExtractedHouse, b?: ExtractedHouse, label: string) => {
      if (!a || !b) return { label: `${label} — data missing`, tie: true as const };
      if (a.normalized.total === b.normalized.total) return { label: `${label} Balanced`, tie: true as const };
      return a.normalized.total > b.normalized.total ? { label, winner: `${HOUSE_NAMES[a.id]}` } : { label, winner: `${HOUSE_NAMES[b.id]}` };
    };
    return [safe(byId(1), byId(7), "1↔7"), safe(byId(4), byId(10), "4↔10"), safe(byId(5), byId(11), "5↔11")];
  }, [houses]); // safe because byId derives from houses

  const shareLiteText = useMemo(() => {
    const bosses = bossBadges.map((b) => `House ${b.id} 👑`).slice(0, 2).join(", ") || "No Boss houses";
    const weaks = weakBadges.map((w) => `House ${w.id} 🫂`).slice(0, 2).join(", ") || "All supported";
    return `My BhavaBala: Boss ${bosses} • Weak ${weaks}`;
  }, [bossBadges, weakBadges]);

  const actions = (
    <ResponsiveActionBar>
      {/* Wheel toggle */}
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5">
        <span className="inline-flex items-center gap-1">
          <PanelsTopLeft className="size-3.5" />
          <span className="hidden sm:inline">Wheel</span>
        </span>
        <Switch checked={wheelView} onCheckedChange={setWheelView} />
      </div>

      {/* Classical toggle */}
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5">
        <span className="inline-flex items-center gap-1">
          <Eye className="size-3.5" />
          <span className="hidden sm:inline">Classical</span>
        </span>
        <Switch checked={classicalOn} onCheckedChange={setClassicalOn} />
      </div>

      {/* Show/Hide */}
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

      {/* Lower priority items (collapsible) */}
      <div data-collapsible className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5">
        <span className="inline-flex items-center gap-1">
          <span className="size-3.5 inline-block">🎓</span>
          <span className="hidden sm:inline">Tutor</span>
        </span>
        <Switch checked={tutorMode} onCheckedChange={setTutorMode} />
      </div>

      <Link
        data-collapsible
        href="/bhavabala"
        className="cursor-pointer text-xs rounded-xl border border-white/10 px-3 py-1.5 hover:bg-white/5 text-white/80 inline-flex items-center gap-1"
        aria-label="Learn Bhava Bala"
      >
        <HelpCircle className="size-3.5" />
        <span className="hidden sm:inline">Learn</span>
      </Link>

      <div data-collapsible>
        <ReferenceButton />
      </div>
      <div data-collapsible>
        <PrintButton />
      </div>
    </ResponsiveActionBar>
  );

  /* selection + sparkle */
  const uiHouses = useMemo(() => houses.map((h) => ({ id: h.id, total: h.normalized.total })), [houses]);
  const handleSelect = useCallback(
    (id: number) => {
      setActiveId(id);
      const sel = houses.find((x) => x.id === id);
      const isBossSel = !!sel && sel.normalized.total >= 0.7;
      setSparkle(isBossSel);
      if (isBossSel) {
        setSparkleKey((k) => k + 1);
        haptics.light();
      }
      dismissNudge();
    },
    [houses, haptics, dismissNudge]
  );

  /* weak tips (quests) */
  const weakTips = useMemo(() => {
    const map: Record<number, string> = {};
    for (const q of weakHouseQuests(uiHouses)) map[q.house] = q.tip;
    return map;
  }, [uiHouses]);

  /* Achievements → toasts (dedup loop-safe) */
  useEffect(() => {
    const ach = detectAchievements(uiHouses);
    const next = ach.map((a, i) => ({
      id: a.key + ":" + ((a as any).house ?? String(i)),
      text: a.label,
      emoji: a.emoji,
    }));
    setToasts((prev) => {
      if (prev.length === next.length && prev.every((p, i) => p.id === next[i].id && p.text === next[i].text && p.emoji === next[i].emoji)) {
        return prev;
      }
      return next;
    });
  }, [uiHouses]);

  return (
    <SectionShell
      id="bhavabala"
      title="Bhavabala (House Strength)"
      subtitle={<span className="opacity-80">Normalized scores with classical toggle</span>}
      collapsible
      defaultOpen
      open={!!open}
      actions={actions}
    >
      {/* Fun fact */}
      <div className="-mx-2 px-2 md:mx-0 md:px-0 mt-2 print-hidden">
        <FunFactChip
          facts={[
            "1↔7 shows self ↔ partnerships balance.",
            "4↔10 is roots ↔ career axis.",
            "5↔11 tags creativity ↔ gains.",
          ]}
          autoRotateMs={7000}
        />
      </div>

      {/* Quick Reads */}
      <div className="text-sm font-semibold mb-2 mt-5">Quick Reads</div>
      <QuickRail>
        {ranking.slice(0, 3).map((hid, idx) => {
          const h = byId(hid)!;
          const sub = tutorMode
            ? <>High normalized total for <span className="font-medium">{HOUSE_NAMES[h.id]}</span>.</>
            : <>{wittyHouseLine(h.id, h.normalized.total)} <span className="opacity-80">{emojiForBucket[bucket(h.normalized.total)]}</span></>;
          return (
            <WiggleOnMount key={h.id} delay={idx * 0.05}>
              <QuickCard title={`Strong focus: ${HOUSE_NAMES[h.id]}`} subtitle={sub as any} score={h.normalized.total} onClick={() => handleSelect(h.id)} />
            </WiggleOnMount>
          );
        })}
      </QuickRail>

      {/* Axis pairs rail */}
      <QuickRail>
        {[
          { a: byId(1), b: byId(7), label: "1↔7" },
          { a: byId(4), b: byId(10), label: "4↔10" },
          { a: byId(5), b: byId(11), label: "5↔11" },
        ]
          .filter((p) => p.a && p.b)
          .map((p, idx) => {
            const text =
              p.a!.normalized.total === p.b!.normalized.total
                ? "Balanced — comparable right now."
                : p.a!.normalized.total > p.b!.normalized.total
                ? `${HOUSE_NAMES[p.a!.id]} outweighs ${HOUSE_NAMES[p.b!.id]}`
                : `${HOUSE_NAMES[p.b!.id]} outweighs ${HOUSE_NAMES[p.a!.id]}`;
            return (
              <WiggleOnMount key={p.label} delay={idx * 0.05}>
                <QuickCard title={p.label} subtitle={text} score={Math.max(p.a!.normalized.total, p.b!.normalized.total)} />
              </WiggleOnMount>
            );
          })}
      </QuickRail>

      {/* Passive recognition */}
      <div className="mt-3 print-hidden">
        <BossWeakBadgeFeed items={[...bossBadges, ...weakBadges]} />
      </div>

      {/* Wheel or Cards */}
      {wheelView ? (
        <div className="mt-2">
          <SpokeWheel
            count={houses.length}
            values={houses.map((h) => h.normalized.total)}
            onSelect={(i) => handleSelect(houses[i].id)}
            fillForIndex={(i, v) =>
              bucket(v) === "boss"
                ? "fill-emerald-400/15"
                : bucket(v) === "steady"
                ? "fill-violet-400/15"
                : bucket(v) === "boost"
                ? "fill-amber-400/15"
                : "fill-rose-400/15"
            }
            labelForIndex={(i) => HOUSE_NAMES[houses[i].id] ?? `House ${houses[i].id}`}
          />
          {showNudge && <div className="mt-2 text-center text-sm text-dim">Tap a house for Spotlight ↗</div>}
        </div>
      ) : (
        /* Minimal cards — summary only; details live in Spotlight */
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {houses.map((h) => {
            const boss = h.normalized.total >= 0.7;
            const CardShell = boss ? BossHouseCard : NonBossHouseCard;
            const sticker = boss ? HOUSE_STICKERS?.[h.id] : null;
            const oneLiner =
              tutorMode
                ? `Shows ${Math.round(h.normalized.total * 100)}% strength. Align with its karakas.`
                : wittyHouseLine(h.id, h.normalized.total);

            return (
              <CardShell key={h.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">{HOUSE_NAMES[h.id] ?? `House ${h.id}`}</h3>
                      {sticker ? (
                        <span className="inline-flex">
                          <StickerTag tone={sticker.tone ?? "emerald"}>{sticker.emoji} {sticker.label}</StickerTag>
                        </span>
                      ) : null}
                    </div>
                    <AnimatedScaleBadge value={h.normalized.total} />
                  </div>
                  <div className="shrink-0">
                    <StrengthRing
                      value={h.normalized.total}
                      sparkleKey={boss ? sparkleKey : undefined}
                      aria-label={`${HOUSE_NAMES[h.id] ?? `House ${h.id}`} total strength ${Math.round(h.normalized.total * 100)}%`}
                    />
                  </div>
                </div>

                {/* summary line */}
                <div className="mt-2 text-sm opacity-90">{oneLiner}</div>

                {/* optional tiny quest hint */}
                {weakTips[h.id] ? <div className="mt-2 text-xs opacity-75">Tip: {weakTips[h.id]}</div> : null}

                <div className="mt-4">
                  <button
                    className="rounded-xl px-3 py-2 bg-white/5 hover:bg-white/10 transition"
                    onClick={() => handleSelect(h.id)}
                    aria-label={`Open ${HOUSE_NAMES[h.id] ?? `House ${h.id}`} Spotlight`}
                  >
                    View Spotlight
                  </button>
                </div>
              </CardShell>
            );
          })}
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
        shareLiteText={shareLiteText}
      />

      {/* Achievement toasts */}
      {toasts.map((t) => (
        <AchievementToast key={t.id} text={t.text} emoji={t.emoji} onClose={() => setToasts((s) => s.filter((x) => x.id !== t.id))} />
      ))}
    </SectionShell>
  );
}
