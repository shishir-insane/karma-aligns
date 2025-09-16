'use client';

import { useMemo, useState } from "react";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import { H1, H2, H3, Small, BtnLabel } from "@/components/ui/Type";
import { normalizeCompute, type Norm } from "./normalizeCompute";
import JsonExplorer from "@/components/results/JsonExplorer";
import Shadbala from "@/components/results/Shadbala";
import BhavaBala from "@/components/results/BhavaBala";

/* ---------- tiny helpers ---------- */
const isObj = (x: any) => x && typeof x === "object" && !Array.isArray(x);
const STR = (x: any) => (x == null ? "" : String(x));
const NUM = (x: any) => (x == null || x === "" || isNaN(Number(x)) ? 0 : Number(x));
const toArr = <T = any>(x: any): T[] => Array.isArray(x) ? x : x == null ? [] : isObj(x) ? (Object.values(x) as T[]) : [x as T];

/* ---------- small UI primitives ---------- */
const Card = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_6px_24px_rgba(99,102,241,.18)] ${className}`}>{children}</div>
);
const Stat = ({ label, value }: { label: string; value?: string }) => (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 min-w-[9rem]">
        <div className="text-xs text-white/60">{label}</div>
        <div className="mt-1 text-lg font-semibold">{value ?? "—"}</div>
    </div>
);

/* ---------- planet/sign/house quick meanings for tooltips ---------- */
const PlanetMeta: Record<string, { emoji: string; title: string; about: string }> = {
    Sun: { emoji: "☀️", title: "Sun • Self / Vitality", about: "Ego, life-force, purpose, visibility." },
    Moon: { emoji: "🌙", title: "Moon • Emotions / Needs", about: "Feelings, instincts, comfort, habits." },
    Mercury: { emoji: "☿️", title: "Mercury • Mind / Comms", about: "Thinking, talking, learning, commerce." },
    Venus: { emoji: "♀️", title: "Venus • Love / Aesthetics", about: "Affection, beauty, taste, money vibes." },
    Mars: { emoji: "♂️", title: "Mars • Drive / Action", about: "Energy, courage, conflict, desire." },
    Jupiter: { emoji: "♃", title: "Jupiter • Growth / Luck", about: "Expansion, faith, teachers, optimism." },
    Saturn: { emoji: "♄", title: "Saturn • Discipline", about: "Boundaries, lessons, time, responsibility." },
    Rahu: { emoji: "☊", title: "Rahu • North Node", about: "Cravings, future pull, obsessions, growth edges." },
    Ketu: { emoji: "☋", title: "Ketu • South Node", about: "Past mastery, detachment, release, intuitions." },
    Asc: { emoji: "↗︎", title: "Ascendant • Rising", about: "Vibe, doorway, first impressions." },
};
const SignHints: Record<string, string> = {
    Aries: "Bold, raw energy", Taurus: "Grounded, sensory", Gemini: "Curious, chatty", Cancer: "Nurturing, moody",
    Leo: "Creative, radiant", Virgo: "Precise, practical", Libra: "Harmonious, aesthetic", Scorpio: "Intense, transformative",
    Sagittarius: "Expansive, questing", Capricorn: "Structured, ambitious", Aquarius: "Unique, future-minded", Pisces: "Dreamy, mystical"
};
const HouseHints: Record<string, string> = {
    "1": "Self, body, persona", "2": "Money, values", "3": "Mind, siblings", "4": "Home, roots", "5": "Creativity, romance",
    "6": "Work, wellness", "7": "Partners, mirrors", "8": "Merges, shadow", "9": "Beliefs, journeys", "10": "Career, legacy",
    "11": "Friends, future", "12": "Dreams, retreat"
};

/* ---------- pull *specifically* data.table (any common shape) ---------- */
type UITbl = { title: string; head: string[]; rows: (string | number)[][] };
function tableFromAny(node: any, title: string): UITbl | null {
    if (node == null) return null;
    if (isObj(node) && (Array.isArray(node.head) || Array.isArray(node.headers) || Array.isArray(node.rows) || Array.isArray(node.data))) {
        const head = toArr<string>(node.head ?? node.headers).map(STR);
        const rows = toArr<any>(node.rows ?? node.data).map((r: any) =>
            Array.isArray(r) ? r.map(STR) : Object.values(r ?? {}).map(STR)
        );
        return rows.length ? { title, head, rows } : null;
    }
    if (Array.isArray(node) && node.every(Array.isArray)) {
        const rows = (node as any[]).map(r => r.map(STR));
        const maxLen = rows.reduce((m, r) => Math.max(m, r.length), 0);
        const head = Array.from({ length: maxLen }, (_, i) => `Col ${i + 1}`);
        return rows.length ? { title, head, rows } : null;
    }
    if (Array.isArray(node) && node.every(isObj)) {
        const keys = Array.from(new Set((node as Record<string, any>[]).flatMap(o => Object.keys(o))));
        const head = keys;
        const rows = (node as Record<string, any>[]).map(o => keys.map(k => STR(o[k])));
        return rows.length ? { title, head, rows } : null;
    }
    if (isObj(node)) {
        const keys = Object.keys(node);
        const allArrays = keys.length && keys.every(k => Array.isArray((node as any)[k]));
        if (allArrays) {
            const len = Math.max(...keys.map(k => ((node as any)[k] as any[]).length));
            const rows: (string | number)[][] = [];
            for (let i = 0; i < len; i++) rows.push(keys.map(k => STR(((node as any)[k] as any[])[i])));
            return { title, head: keys, rows };
        }
    }
    if (typeof node === "string") {
        try { const parsed = JSON.parse(node); return tableFromAny(parsed, title); } catch { }
    }
    return null;
}
function getDataTable(data?: any): UITbl | null {
    if (!data) return null;
    const root = (data as any).table ?? (data as any).tables ?? (data as any).tabular;
    if (root != null) {
        if (Array.isArray(root)) return tableFromAny(root, "Planetary Positions");
        if (isObj(root)) {
            const single = tableFromAny(root, "Planetary Positions");
            if (single) return single;
            const match = Object.entries(root).find(([k]) => /planet|position|grah|lagna|rasi/i.test(k));
            if (match) return tableFromAny(match[1], "Planetary Positions");
            const first = Object.values(root)[0];
            return tableFromAny(first, "Planetary Positions");
        }
        return tableFromAny(root, "Planetary Positions");
    }
    return null;
}

/* ---------- Building blocks ---------- */
function PlanetBadge({ name }: { name: string }) {
    const meta = PlanetMeta[name] || { emoji: "✨", title: name, about: "" };
    return (
        <div className="flex items-center gap-2">
            <div className="text-lg">{meta.emoji}</div>
            <div className="leading-tight">
                <div className="font-semibold">{name}</div>
                <div className="text-[11px] text-white/60">{meta.title}</div>
            </div>
        </div>
    );
}
function CellTip({ label, sub, hint, badge }: { label: string; sub?: string; hint?: string; badge?: string }) {
    return (
        <div className="relative group inline-flex items-center gap-2">
            <div className="leading-tight">
                <div className="font-medium">{label}</div>
                {sub ? <div className="text-xs text-white/70">{sub}</div> : null}
            </div>
            {badge ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 border border-white/15">{badge}</span> : null}
            {hint ? (
                <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-xl border border-white/10 bg-[#0e1224] p-3 text-xs leading-relaxed text-white/85 shadow-xl group-hover:block">
                    {hint}
                </div>
            ) : null}
        </div>
    );
}

/* ---------- Planetary Positions (mobile = cards; md+ = table) ---------- */
function InteractivePositions({ table }: { table: UITbl }) {
    const headers = table.head.map(h => STR(h).trim());
    const idx = {
        body: headers.findIndex(h => /planet|body|graha|name/i.test(h)),
        sign: headers.findIndex(h => /sign|rasi|zodiac/i.test(h)),
        deg: headers.findIndex(h => /deg|degree|longitude/i.test(h)),
        house: headers.findIndex(h => /house|bhava/i.test(h)),
        retro: headers.findIndex(h => /retro|R\b/i.test(h)),
        nak: headers.findIndex(h => /nakshatra|star/i.test(h)),
    };
    const rows = table.rows.map((r) => {
        const body = STR(idx.body >= 0 ? r[idx.body] : r[0]).replace(/\s+/g, ' ').trim();
        const sign = STR(idx.sign >= 0 ? r[idx.sign] : "");
        const deg = NUM(idx.deg >= 0 ? r[idx.deg] : "");
        const house = STR(idx.house >= 0 ? r[idx.house] : "");
        const retro = STR(idx.retro >= 0 ? r[idx.retro] : "").toUpperCase().startsWith("R");
        const nak = STR(idx.nak >= 0 ? r[idx.nak] : "");
        return { body, sign, deg, house, retro, nak };
    }).filter(x => x.body);

    /* --- Mobile cards (no horizontal scroll) --- */
    const Mobile = () => (
        <div className="space-y-3 md:hidden">
            {rows.map((row, i) => {
                const pmeta = PlanetMeta[row.body] || PlanetMeta[row.body.split(' ')[0]];
                const signHint = SignHints[row.sign] || "";
                const houseHint = HouseHints[row.house] || "";
                const retroBadge = row.retro ? "R" : "D";
                return (
                    <div
                        key={`${row.body}-${i}`}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/7"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <PlanetBadge name={pmeta ? row.body : row.body} />
                            <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]
                ${row.retro ? "border-amber-400/30 bg-amber-300/10 text-amber-300" : "border-emerald-400/20 bg-emerald-300/10 text-emerald-300"}`}>
                                <span className="font-semibold">{retroBadge}</span>
                                <span>{row.retro ? "Retrograde" : "Direct"}</span>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="text-[11px] text-white/60 mb-1">Sign</div>
                                <CellTip label={row.sign || "—"} hint={signHint} />
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="text-[11px] text-white/60 mb-1">House</div>
                                <CellTip label={row.house || "—"} hint={houseHint} />
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="text-[11px] text-white/60 mb-1">Degree</div>
                                <div className="text-sm font-medium">{row.deg ? row.deg.toFixed(2) : "—"}</div>
                                {row.deg ? (
                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10" title="0°–30° within the sign">
                                        <div className="h-full bg-gradient-to-r from-pink-400 to-violet-500" style={{ width: `${Math.min(100, (row.deg / 30) * 100)}%` }} />
                                    </div>
                                ) : null}
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                <div className="text-[11px] text-white/60 mb-1">Nakshatra</div>
                                <div className="text-sm">{row.nak || "—"}</div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    /* --- Desktop/tablet interactive table --- */
    const Desktop = () => (
        <div className="hidden md:block">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                <div className="sticky top-0 z-10 grid grid-cols-6 gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                    <div>Planet</div><div>Sign</div><div>° Degree</div><div>House</div><div>Nakshatra</div><div>Status</div>
                </div>
                <ul className="divide-y divide-white/5">
                    {rows.map((row, i) => {
                        const pmeta = PlanetMeta[row.body] || PlanetMeta[row.body.split(' ')[0]];
                        const signHint = SignHints[row.sign] || "";
                        const houseHint = HouseHints[row.house] || "";
                        const retroBadge = row.retro ? "R" : "";
                        return (
                            <li
                                key={`${row.body}-${i}`}
                                className="group grid grid-cols-6 gap-3 px-4 py-3 transition-all hover:bg-white/7 hover:shadow-[0_10px_30px_rgba(147,51,234,.22)]"
                            >
                                <div className="flex items-center">
                                    <div className="relative">
                                        <PlanetBadge name={pmeta ? row.body : row.body} />
                                        {pmeta ? (
                                            <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-64 rounded-xl border border-white/10 bg-[#0e1224] p-3 text-xs leading-relaxed text-white/85 shadow-xl group-hover:block">
                                                <div className="font-semibold mb-1">{pmeta.title}</div>
                                                <div>{pmeta.about}</div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="flex items-center"><CellTip label={row.sign || "—"} hint={signHint} /></div>
                                <div className="flex items-center">
                                    <div className="w-full">
                                        <div className="text-sm font-medium">{row.deg ? row.deg.toFixed(2) : "—"}</div>
                                        {row.deg ? (
                                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10" title="0°–30° within the sign">
                                                <div className="h-full bg-gradient-to-r from-pink-400 to-violet-500" style={{ width: `${Math.min(100, (row.deg / 30) * 100)}%` }} />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="flex items-center"><CellTip label={row.house || "—"} hint={houseHint} /></div>
                                <div className="flex items-center"><CellTip label={row.nak || "—"} /></div>
                                <div className="flex items-center">
                                    <div className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs
                      ${row.retro ? "border-amber-400/30 bg-amber-300/10 text-amber-300" : "border-emerald-400/20 bg-emerald-300/10 text-emerald-300"}`}>
                                        <span className="font-semibold">{retroBadge || "D"}</span>
                                        <span>{row.retro ? "Retrograde" : "Direct"}</span>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="mt-2 text-[11px] text-white/60">Tip: hover elements for quick meanings • degree bar shows position within the sign.</div>
        </div>
    );

    return (
        <>
            <Mobile />
            <Desktop />
        </>
    );
}

/* ---------- Bars / Heatmap / Timeline / HouseGrid ---------- */
function Bars({ data, unit = "" }: { data: Array<{ id?: string | number; label: string; value: number }>; unit?: string }) {
    if (!data?.length) return null;
    const vmax = Math.max(...data.map(d => d.value || 0), 1);
    return (
        <div className="space-y-3">
            {data.map((d, i) => {
                const key =
                    d.key != null
                        ? `k-${String(d.key)}`
                        : d.id != null
                            ? `id-${String(d.id)}-${i}`  // namespace id and add index to break ties (handles id=0)
                            : `lbl-${d.label ?? "item"}-${i}`;
                return (
                    <div key={key}>
                        <div className="flex justify-between text-xs text-white/60 mb-1">
                            <span className="truncate">{d.label}</span>
                            <span>{d.value.toFixed(2)}{unit}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600" style={{ width: `${Math.min(100, (d.value / vmax) * 100)}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
function Heatmap({ headers = [], rows = [] as Array<{ name: string; cells: number[] }>, totals }: { headers?: string[]; rows: Array<{ name: string; cells: number[] }>; totals?: number[] }) {
    if (!rows?.length) return null;
    const cols = headers.length || (rows[0]?.cells?.length ?? 0);
    const maxV = Math.max(...rows.flatMap(r => r.cells ?? [0]), 1);
    const head = headers.length ? headers : Array(rows[0]?.cells?.length ?? 0).fill(null);
    return (
        <div className="overflow-x-auto -mx-1">
            <div className="inline-block min-w-max px-1">
                <div className="grid" style={{ gridTemplateColumns: `8rem repeat(${cols}, 3rem)` }}>
                    <div />
                    {head.map((h, i) => <div key={i} className="text-xs text-center text-white/60 py-1">{h ?? `H${i + 1}`}</div>)}
                    {rows.map((r, ri) => (
                        <div className="contents" key={`row-${ri}`}>
                            <div className="text-sm pr-3 py-1.5 text-white/80">{r.name}</div>
                            {r.cells.map((v, ci) => {
                                const pct = v / maxV;
                                return (
                                    <div key={`${ri}-${ci}`} className="p-1">
                                        <div className="h-7 rounded-md" style={{ background: `linear-gradient(180deg, rgba(217,70,239,${0.12 + pct * 0.65}) 0%, rgba(99,102,241,${0.12 + pct * 0.65}) 100%)` }} />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    {totals?.length ? (<><div className="text-xs pr-3 py-1.5 text-white/70">SAV</div>{totals.map((v, i) => <div key={`sav-${i}`} className="text-xs py-1.5 text-center text-white/80">{v}</div>)}</>) : null}
                </div>
            </div>
        </div>
    );
}
function Timeline({ items, caption }: { items: Array<{ name: string; from: string; to: string; strength?: number }>; caption?: string }) {
    if (!items?.length) return null;
    const t0 = new Date(items[0].from).getTime();
    const t1 = new Date(items[items.length - 1].to).getTime();
    const span = Math.max(1, t1 - t0);
    return (
        <div className="w-full">
            {caption && <div className="text-xs text-white/60 mb-1">{caption}</div>}
            <div className="-mx-1 overflow-x-auto">
                <div className="relative h-16 min-w-[640px] rounded-xl border border-white/10 bg-white/5 px-2 py-3">
                    {items.map((it, i) => {
                        const a = (new Date(it.from).getTime() - t0) / span;
                        const b = (new Date(it.to).getTime() - t0) / span;
                        const left = `${a * 100}%`;
                        const width = `${Math.max(0.02, b - a) * 100}%`;
                        return (
                            <div key={i} className="absolute top-3 h-7 rounded-lg text-[11px] leading-7 text-center" style={{ left, width, background: "linear-gradient(90deg, rgba(236,72,153,.55), rgba(147,51,234,.55))", boxShadow: "0_4px_14px_rgba(168,85,247,.25)" }}>
                                {it.name}
                            </div>
                        );
                    })}
                    <div className="absolute left-0 right-0 bottom-1 text-[10px] text-white/50 flex justify-between px-2">
                        <span>{new Date(items[0].from).toLocaleDateString()}</span>
                        <span>{new Date(items[items.length - 1].to).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
const HouseGrid = ({ houses = [] as Array<{ house: number; sign?: string; lord?: string; bodies?: string[]; degree?: number }> }) => {
    if (!houses?.length) return null;
    const sorted = [...houses].sort((a, b) => a.house - b.house);
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {sorted.map(h => (
                <div key={h.house} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/60">House {h.house}</div>
                    <div className="text-base font-semibold">{h.sign || "—"}</div>
                    {h.bodies?.length ? <div className="mt-1 text-[11px] text-white/70 truncate">{h.bodies.join(", ")}</div> : null}
                    <div className="text-[10px] text-white/50">{h.lord ? `Lord: ${h.lord}` : ""}</div>
                </div>
            ))}
        </div>
    );
};

/* ---------- PAGE ---------- */
export default function ResultsPage({
    name = 'Guest',
    birth = { date: '', time: '', tz: '', location: '' },
    chartImg = '/sample-chart.png',
    acg,
    data,
}: {
    name?: string;
    birth?: { date: string; time: string; tz: string; location: string };
    chartImg?: string;
    acg?: Norm["acg"];
    data?: any;
}) {
    const norm = useMemo<Norm>(() => normalizeCompute({ ...(data || {}), acg }), [data, acg]);
    const raw = (data ?? {}) as Record<string, any>;
    const planetaryTable = useMemo(() => getDataTable(data), [data]);

    const [activePlanets, setActive] = useState<string[]>(["Jupiter", "Venus", "Sun"]);
    const toggle = (p: string) => setActive(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p]);

    const extraKeys = Object.keys(norm.extras ?? {});

    return (
        <div className="relative min-h-screen bg-[#0b0e18] text-white">
            <SiteHeader />

            {/* Sticky sub-nav */}
            <div className="sticky top-14 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/10 border-y border-white/10">
                <div className="container mx-auto px-4 sm:px-6 py-2 overflow-x-auto no-scrollbar flex gap-2 sm:gap-3 text-xs">
                    {[
                        ["overview", "#overview"], ["strength", "#strength"], ["ashtaka", "#ashtaka"], ["dashas", "#dashas"],
                        ["charts", "#charts"], ["vargas", "#vargas"], ["positions", "#positions"],
                        ["predictions", "#predictions"], ["kundli yogas", "#kundliyogas"],
                        ["transits", "#transits"], ["map", "#acg"], ["aspects", "#aspects"],
                        ["raw", "#raw"], ["other", "#other"]
                    ].map(([t, href]) => (
                        <a key={href} href={href} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/8 whitespace-nowrap">{t}</a>
                    ))}
                </div>
            </div>

            {/* Overview */}
            <section id="overview" className="container mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <H1 className="leading-[1.05]">Chart results</H1>
                        <Small className="mt-2">{name} • {birth.date} {birth.time} {birth.tz} • {birth.location}</Small>
                    </div>
                    <a href="/" className="rounded-2xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-[0_8px_30px_rgba(168,85,247,.30)]"><BtnLabel>✨ Generate another</BtnLabel></a>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
                    <Stat label="Sun sign" value={norm.identity?.sun} />
                    <Stat label="Moon sign" value={norm.identity?.moon} />
                    <Stat label="Rising" value={norm.identity?.rising} />
                    <Stat label="Nakshatra" value={norm.identity?.nakshatra} />
                    <Stat label="Ayanāṃśa" value={norm.identity?.ayanamsha} />
                </div>

                {/* Classical Reading */}
                {norm.predictions?.classicalReading ? (
                    <Card className="mt-6">
                        <H2 className="mb-2">Classical reading</H2>
                        <p className="text-white/85 whitespace-pre-line">{norm.predictions.classicalReading}</p>
                    </Card>
                ) : null}

                {/* Planetary Positions (from data.table) */}
                {planetaryTable ? (
                    <Card className="mt-6">
                        <div className="flex items-center justify-between mb-3">
                            <H2 className="m-0">Planetary Positions</H2>
                            <div className="text-xs text-white/60">Mobile-first • no sideways scroll</div>
                        </div>
                        <InteractivePositions table={planetaryTable} />
                    </Card>
                ) : null}

                {/* Shadbala (from data.shadbala) */}
                <Card className="mt-6">
                    <Shadbala data={data} norm={norm} />
                </Card>
                <Card className="mt-6">
                    <BhavaBala data={data} />
                </Card>
            </section>

            {/* Strengths / Shadbala / Bhava */}
            {(norm.strengths?.length || norm.shadbala?.length || norm.bhavaBala?.length) && (
                <section id="strength" className="container mx-auto px-4 sm:px-6 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {norm.strengths?.length ? (
                        <Card>
                            <H2 className="mb-3">Planet strengths</H2>
                            <Bars data={norm.strengths.map(s => ({ id: s.body, label: s.body, value: s.score }))} />
                        </Card>
                    ) : null}
                    {norm.shadbala?.length ? (
                        <Card>
                            <H2 className="mb-3">Shadbala</H2>
                            <Bars data={norm.shadbala.map(s => ({ id: s.pillar, label: s.pillar, value: s.value }))} />
                        </Card>
                    ) : null}
                    {norm.bhavaBala?.length ? (
                        <Card>
                            <H2 className="mb-3">Bhava Bala</H2>
                            <Bars data={norm.bhavaBala.map(h => ({ id: h.house, label: `House ${h.house} (${(h.net ?? h.score)})`, value: (h.net ?? h.score) || 0 }))} />
                        </Card>
                    ) : null}
                </section>
            )}

            {/* Ashtakavarga */}
            {norm.ashtakavarga?.rows?.length ? (
                <section id="ashtaka" className="container mx-auto px-4 sm:px-6 pb-10">
                    <H2 className="mb-3">Ashtakavarga</H2>
                    <Card><Heatmap headers={norm.ashtakavarga.headers} rows={norm.ashtakavarga.rows} totals={norm.ashtakavarga.totals} /></Card>
                </section>
            ) : null}

            {/* Dasha timelines */}
            {norm.dashas?.length ? (
                <section id="dashas" className="container mx-auto px-4 sm:px-6 pb-10">
                    <H2 className="mb-3">Dasha timelines</H2>
                    <div className="space-y-4">
                        {norm.dashas.map((d, i) => (
                            <Card key={i}>
                                <Small className="mb-2 text-white/70">{d.system}</Small>
                                <Timeline items={d.items} caption="Active periods" />
                            </Card>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* Charts */}
            {(norm.charts?.rasiHouses?.length || norm.charts?.chalitHouses?.length) ? (
                <section id="charts" className="container mx-auto px-4 sm:px-6 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {norm.charts?.rasiHouses?.length ? <Card><H2 className="mb-3">Rāśi (sign chart)</H2><HouseGrid houses={norm.charts.rasiHouses as any} /></Card> : null}
                    {norm.charts?.chalitHouses?.length ? <Card><H2 className="mb-3">Chalit (unequal houses)</H2><HouseGrid houses={norm.charts.chalitHouses as any} /></Card> : null}
                </section>
            ) : null}

            {/* Predictions (except Classical) */}
            {(norm.predictions?.summary || norm.predictions?.categories?.length) ? (
                <section id="predictions" className="container mx-auto px-4 sm:px-6 pb-10">
                    <H2 className="mb-3">Predictions</H2>
                    <Card>
                        {norm.predictions?.summary ? (
                            <Small className="block mb-4 text-white/80">{norm.predictions.summary}</Small>
                        ) : null}
                        {norm.predictions?.categories?.length ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {norm.predictions.categories.map((c) => (
                                    <div key={c.key} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-semibold">{c.title}</div>
                                                {c.timeframe ? <div className="text-xs text-white/60">{c.timeframe}</div> : null}
                                            </div>
                                            {typeof c.score === "number" ? (
                                                <div className="text-right">
                                                    <div className="text-xs text-white/60">Score</div>
                                                    <div className="text-sm font-semibold">{c.score}</div>
                                                </div>
                                            ) : null}
                                        </div>

                                        {c.summary ? (
                                            <p className="mt-2 text-sm text-white/85 whitespace-pre-line">{c.summary}</p>
                                        ) : null}

                                        {c.bullets?.length ? (
                                            <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                                                {c.bullets.map((b, i) => <li key={i}>{b}</li>)}
                                            </ul>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </Card>
                </section>
            ) : null}

            {/* Kundli Yogas */}
            {norm.kundliYogas?.length ? (
                <section id="kundliyogas" className="container mx-auto px-4 sm:px-6 pb-10">
                    <H2 className="mb-3">Kundli Yogas</H2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {norm.kundliYogas.map((y, i) => (
                            <Card key={i} className="p-4">
                                <div className="font-semibold mb-1">Yoga {i + 1}</div>
                                <p className="text-sm text-white/85 whitespace-pre-line">{y}</p>
                            </Card>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* ACG (map + advice + places) */}
            {(norm.acg?.lines || norm.acg?.advice || norm.acg?.places) ? (
                <section id="acg" className="container mx-auto px-4 sm:px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <H2>Astro-cartography</H2>
                        {/* Keep your ACGMap here if you already rendered it previously */}
                    </div>
                    {(norm.acg?.advice || norm.acg?.places) ? (
                        <div className="space-y-6">
                            {norm.acg?.advice ? (
                                <Card>
                                    <H3 className="mb-3">Advice</H3>
                                    <div className="space-y-4">
                                        {Object.entries(norm.acg.advice).map(([k, arr]) => (
                                            <div key={k}>
                                                <Small className="text-white/70">{k}</Small>
                                                <ul className="mt-1 text-sm list-disc list-inside space-y-1">
                                                    {toArr<string>(arr).map((s, i) => <li key={i}>{s}</li>)}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ) : null}
                        </div>
                    ) : null}
                </section>
            ) : null}

            {/* Aspects */}
            {norm.aspects?.length ? (
                <section id="aspects" className="container mx-auto px-4 sm:px-6 pb-10">
                    <H2 className="mb-3">Aspects</H2>
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-white/70">
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-2 pr-4">From</th>
                                        <th className="text-left py-2 pr-4">To</th>
                                        <th className="text-left py-2 pr-4">Type</th>
                                    </tr>
                                </thead>
                                <tbody className="text-white/85">
                                    {norm.aspects.map((a, i) => (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-2 pr-4">{a.from}</td>
                                            <td className="py-2 pr-4">{a.to}</td>
                                            <td className="py-2 pr-4">{a.type}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>
            ) : null}

            {/* Raw JSON */}
            <section id="raw" className="container mx-auto px-4 sm:px-6 pb-10">
                <H2 className="mb-3">Full data</H2>
                <Card><JsonExplorer data={raw} /></Card>
            </section>

            {/* Other data */}
            {extraKeys.length ? (
                <section id="other" className="container mx-auto px-4 sm:px-6 pb-20">
                    <H2 className="mb-3">Other data</H2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {extraKeys.map((k) => (
                            <Card key={k}>
                                <H3 className="mb-2">{k}</H3>
                                <JsonExplorer data={norm.extras?.[k]} />
                            </Card>
                        ))}
                    </div>
                </section>
            ) : null}

            <SiteFooter />
        </div>
    );
}
