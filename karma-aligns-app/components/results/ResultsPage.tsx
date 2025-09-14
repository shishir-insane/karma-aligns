// components/results/ResultsPage.tsx
'use client';

import Image from "next/image";
import { useMemo, useState } from "react";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import { H1, H2, H3, Body, Small, BtnLabel } from "@/components/ui/Type";
import { normalizeCompute, type Norm } from "./normalizeCompute";
import JsonExplorer from "@/components/results/JsonExplorer";

/* ------- UI primitives ------- */
const Card = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_6px_24px_rgba(99,102,241,.18)] ${className}`}>{children}</div>
);
const Stat = ({ label, value }: { label: string; value?: string }) => (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 min-w-[9rem]">
        <div className="text-xs text-white/60">{label}</div>
        <div className="mt-1 text-lg font-semibold">{value ?? "—"}</div>
    </div>
);
const Pill = ({ children }: { children: React.ReactNode }) => (
    <span className="px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10">{children}</span>
);

/* ------- bars ------- */
function Bars({ data, unit = "" }: { data: Array<{ label: string; value: number }>; unit?: string }) {
    if (!data?.length) return null;
    const vmax = Math.max(...data.map(d => d.value || 0), 1);
    return (
        <div className="space-y-3">
            {data.map((d) => (
                <div key={d.label}>
                    <div className="flex justify-between text-xs text-white/60 mb-1">
                        <span className="truncate">{d.label}</span>
                        <span>{d.value.toFixed(2)}{unit}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600" style={{ width: `${Math.min(100, (d.value / vmax) * 100)}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

const ScoreDot = ({ value }: { value?: number }) => {
    if (value == null || isNaN(value)) return null;
    // normalize to 0..100 for width
    const pct = Math.max(0, Math.min(100, value <= 5 ? (value / 5) * 100 : value));
    return (
        <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600" style={{ width: `${pct}%` }} />
        </div>
    );
};


/* ------- heatmap (ashtakavarga) ------- */
function Heatmap({ headers = [], rows = [] as Array<{ name: string; cells: number[] }>, totals }: { headers?: string[]; rows: Array<{ name: string; cells: number[] }>; totals?: number[] }) {
    if (!rows?.length) return null;
    const cols = headers.length || (rows[0]?.cells?.length ?? 0);
    const maxV = Math.max(...rows.flatMap(r => r.cells ?? [0]), 1);
    return (
        <div className="overflow-x-auto -mx-1">
            <div className="inline-block min-w-max px-1">
                <div className="grid" style={{ gridTemplateColumns: `8rem repeat(${cols}, 3rem)` }}>
                    <div />
                    {(headers.length ? headers : Array(rows[0]?.cells?.length ?? 0).fill(null)).map((h, i) => (
                        <div key={i} className="text-xs text-center text-white/60 py-1">{h ?? `H${i + 1}`}</div>
                    ))}
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
                    {totals?.length ? (
                        <>
                            <div className="text-xs pr-3 py-1.5 text-white/70">SAV</div>
                            {totals.map((v, i) => <div key={`sav-${i}`} className="text-xs py-1.5 text-center text-white/80">{v}</div>)}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

/* ------- simple table ------- */
function Table({ head, rows }: { head: string[]; rows: (string | number | React.ReactNode)[][] }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="text-white/70">
                    <tr className="border-b border-white/10">{head.map((h, i) => <th key={i} className="text-left py-2 pr-4">{h}</th>)}</tr>
                </thead>
                <tbody className="text-white/85">
                    {rows.map((r, ri) => (
                        <tr key={ri} className="border-b border-white/5">
                            {r.map((c, ci) => <td key={ci} className="py-2 pr-4">{c as any}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ------- timeline ------- */
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
                        const width = `${Math.max(0.02, (b - a)) * 100}%`;
                        return (
                            <div key={i} className="absolute top-3 h-7 rounded-lg text-[11px] leading-7 text-center"
                                style={{ left, width, background: "linear-gradient(90deg, rgba(236,72,153,.55), rgba(147,51,234,.55))", boxShadow: "0 4px 14px rgba(168,85,247,.25)" }}>
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

/* ------- ACG map ------- */
function ACGMap({ lines = {}, active }: { lines: any; active: string[] }) {
    const planets = Object.keys(lines || {});
    if (!planets.length) return null;
    return (
        <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#0d1224]">
            <div className="aspect-[16/9]">
                <svg viewBox="0 0 100 56" className="w-full h-full">
                    <defs>
                        <linearGradient id="pl" x1="0" x2="1"><stop offset="0" stopColor="#f0abfc" /><stop offset="1" stopColor="#a78bfa" /></linearGradient>
                    </defs>
                    {[...Array(7)].map((_, i) => (<line key={'h' + i} x1="0" y1={8 * i} x2="100" y2={8 * i} stroke="rgba(255,255,255,.06)" strokeWidth="0.2" />))}
                    {[...Array(13)].map((_, i) => (<line key={'v' + i} x1={8 * i} y1="0" x2={8 * i} y2="56" stroke="rgba(255,255,255,.06)" strokeWidth="0.2" />))}
                    {active.map((p) => {
                        const set = lines?.[p];
                        const asc = toPolyline(set?.ASC);
                        const dsc = toPolyline(set?.DSC);
                        return (
                            <g key={p}>
                                {asc && <polyline points={asc} fill="none" stroke="url(#pl)" strokeOpacity="0.75" strokeWidth="0.6" />}
                                {dsc && <polyline points={dsc} fill="none" stroke="#f59e0b" strokeOpacity="0.7" strokeWidth="0.5" />}
                            </g>
                        );
                    })}
                </svg>
            </div>
            <div className="absolute left-3 bottom-3 text-xs text-white/60">ASC = gradient • DSC = amber</div>
        </div>
    );
}
function toPolyline(points?: Array<{ lat: number; lon: number }>) {
    if (!points?.length) return null;
    return points.map(p => {
        const x = ((p.lon + 180) / 360) * 100;
        const y = ((90 - (p.lat + 90)) / 180) * 56;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
}

/* ------- helpers ------- */
const HouseGrid = ({ houses = [] as Array<{ house: number; sign?: string; lord?: string; bodies?: string[]; degree?: number }> }) => {
    if (!houses?.length) return null;
    const sorted = [...houses].sort((a, b) => a.house - b.house);
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
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

    const [activePlanets, setActive] = useState<string[]>(["Jupiter", "Venus", "Sun"]);
    const toggle = (p: string) => setActive(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p]);

    return (
        <div className="relative min-h-screen bg-[#0b0e18] text-white">
            <SiteHeader />

            {/* Sticky sub-nav */}
            <div className="sticky top-14 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/10 border-y border-white/10">
                <div className="container mx-auto px-6 py-2 overflow-x-auto no-scrollbar flex gap-3 text-xs">
                    {[
                        ["overview", "#overview"], ["strength", "#strength"], ["ashtaka", "#ashtaka"], ["dashas", "#dashas"],
                        ["charts", "#charts"], ["vargas", "#vargas"], ["positions", "#positions"],
                        ["transits", "#transits"], ["map", "#acg"], ["aspects", "#aspects"], ["tables", "#tables"], ["raw", "#raw"]
                    ].map(([t, href]) => (
                        <a key={href} href={href} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/8">{t}</a>
                    ))}
                </div>
            </div>

            {/* Header / Overview */}
            <section id="overview" className="container mx-auto px-6 pt-20 pb-8">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <H1 className="leading-[1.05]">Chart results</H1>
                        <Small className="mt-2">{name} • {birth.date} {birth.time} {birth.tz} • {birth.location}</Small>
                    </div>
                    <a href="/" className="rounded-2xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-[0_8px_30px_rgba(168,85,247,.30)]"><BtnLabel>✨ Generate another</BtnLabel></a>
                </div>
                <div className="mt-6 flex gap-3 flex-wrap">
                    <Stat label="Sun sign" value={norm.identity?.sun} />
                    <Stat label="Moon sign" value={norm.identity?.moon} />
                    <Stat label="Rising" value={norm.identity?.rising} />
                    <Stat label="Nakshatra" value={norm.identity?.nakshatra} />
                    <Stat label="Ayanāṃśa" value={norm.identity?.ayanamsha} />
                </div>
            </section>

            {/* Strengths / Shadbala / Bhava */}
            {(norm.strengths?.length || norm.shadbala?.length || norm.bhavaBala?.length) && (
                <section id="strength" className="container mx-auto px-6 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {norm.strengths?.length ? <Card><H2 className="mb-3">Planet strengths</H2><Bars data={norm.strengths.map(s => ({ label: s.body, value: s.score }))} /></Card> : null}
                    {norm.shadbala?.length ? <Card><H2 className="mb-3">Shadbala</H2><Bars data={norm.shadbala.map(s => ({ label: s.pillar, value: s.value }))} /></Card> : null}
                    {norm.bhavaBala?.length ? (
                        <Card>
                            <H2 className="mb-3">Bhava Bala</H2>
                            <Bars data={norm.bhavaBala.map(h => ({ label: `House ${h.house} (${(h.net ?? h.score)})`, value: (h.net ?? h.score) || 0 }))} />
                            <div className="mt-3 text-[11px] text-white/60">Includes benefics/malefics where provided.</div>
                        </Card>
                    ) : null}
                </section>
            )}

            {/* Ashtakavarga */}
            {norm.ashtakavarga?.rows?.length ? (
                <section id="ashtaka" className="container mx-auto px-6 pb-10">
                    <H2 className="mb-3">Ashtakavarga</H2>
                    <Card><Heatmap headers={norm.ashtakavarga.headers} rows={norm.ashtakavarga.rows} totals={norm.ashtakavarga.totals} /></Card>
                </section>
            ) : null}

            {/* Dasha timelines */}
            {norm.dashas?.length ? (
                <section id="dashas" className="container mx-auto px-6 pb-10">
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

            {/* Charts: Rāśi / Chalit */}
            {(norm.charts?.rasiHouses?.length || norm.charts?.chalitHouses?.length) ? (
                <section id="charts" className="container mx-auto px-6 pb-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {norm.charts?.rasiHouses?.length ? (
                        <Card>
                            <H2 className="mb-3">Rāśi (sign chart)</H2>
                            <HouseGrid houses={norm.charts.rasiHouses as any} />
                        </Card>
                    ) : null}
                    {norm.charts?.chalitHouses?.length ? (
                        <Card>
                            <H2 className="mb-3">Chalit (unequal houses)</H2>
                            <HouseGrid houses={norm.charts.chalitHouses as any} />
                        </Card>
                    ) : null}
                </section>
            ) : null}

            {/* Vargas */}
            {norm.charts?.vargas && Object.keys(norm.charts.vargas).length ? (
                <section id="vargas" className="container mx-auto px-6 pb-10">
                    <H2 className="mb-3">Divisional charts</H2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(norm.charts.vargas).map(([name, v]) => (
                            <Card key={name}>
                                <H3 className="mb-2">{name}</H3>
                                <div className="grid grid-cols-6 gap-2">
                                    {v.houses.map((bodies, i) => (
                                        <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-2">
                                            <div className="text-[10px] text-white/60">House {i + 1}</div>
                                            <div className="text-xs">{bodies.join(", ") || "—"}</div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* Positions */}
            {norm.positions?.length ? (
                <section id="positions" className="container mx-auto px-6 pb-10">
                    <H2 className="mb-3">Planetary positions</H2>
                    <Card>
                        <Table
                            head={["Body", "Sign", "Degree", "House", "Retro", "Nakshatra"]}
                            rows={norm.positions.map(p => [p.body, p.sign ?? "—", p.degree?.toFixed(2), p.house ?? "—", p.retro ? "R" : "", p.nakshatra ?? "—"])}
                        />
                    </Card>
                </section>
            ) : null}

            {/* Transits */}
            {norm.transits?.length ? (
                <section id="transits" className="container mx-auto px-6 pb-10">
                    <H2 className="mb-3">Transits</H2>
                    <Card>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-2 px-2">
                            {norm.transits.map((t, i) => (
                                <div key={i} className="min-w-[220px] rounded-xl border border-white/10 bg-white/5 p-4">
                                    <div className="text-xs text-white/60 mb-2">{new Date(t.date).toDateString()}</div>
                                    <ul className="space-y-1 text-sm">
                                        {t.hits.map((h, hi) => <li key={hi}>• {h.body} {h.type} {h.target}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </Card>
                </section>
            ) : null}

            {(norm.predictions?.summary || norm.predictions?.categories?.length) ? (
                <section id="predictions" className="container mx-auto px-6 pb-10">
                    <H2 className="mb-3">Predictions</H2>
                    <Card>
                        {norm.predictions?.summary ? (
                            <Small className="block mb-4 text-white/80">{norm.predictions.summary}</Small>
                        ) : null}
                        {norm.predictions?.categories?.length ? (
                            <div className="space-y-4">
                                {/* chips */}
                                <div className="flex flex-wrap gap-2">
                                    {norm.predictions.categories.map((c) => (
                                        <span key={c.key} className="px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10">
                                            {c.title}
                                        </span>
                                    ))}
                                </div>
                                {/* cards */}
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
                                            {c.summary ? <Small className="mt-2 block">{c.summary}</Small> : null}
                                            {c.bullets?.length ? (
                                                <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                                                    {c.bullets.map((b, i) => <li key={i}>{b}</li>)}
                                                </ul>
                                            ) : null}
                                            <ScoreDot value={c.score} />
                                            {c.items?.length ? (
                                                <div className="mt-3 -mx-1 overflow-x-auto">
                                                    <div className="relative h-14 min-w-[420px] rounded-lg border border-white/10 bg-white/5 px-2 py-3">
                                                        {/* timeline mini-bars */}
                                                        {(() => {
                                                            const t0 = new Date(c.items[0].from ?? 0).getTime();
                                                            const t1 = new Date(c.items[c.items.length - 1].to ?? c.items[c.items.length - 1].from ?? 0).getTime();
                                                            const span = Math.max(1, t1 - t0 || 1);
                                                            return c.items.map((it, i) => {
                                                                const a = new Date(it.from ?? 0).getTime();
                                                                const b = new Date(it.to ?? it.from ?? 0).getTime();
                                                                const left = `${Math.max(0, (a - t0) / span) * 100}%`;
                                                                const width = `${Math.max(0.02, Math.min(1, (b - a) / span)) * 100}%`;
                                                                return (
                                                                    <div key={i} className="absolute top-2 h-8 rounded-md text-[10px] leading-8 text-center"
                                                                        style={{ left, width, background: "linear-gradient(90deg, rgba(236,72,153,.45), rgba(147,51,234,.45))" }}
                                                                        title={`${it.title ?? ""} ${it.from ?? ""} → ${it.to ?? ""}`}>
                                                                        {it.title ?? it.text ?? ""}
                                                                    </div>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </Card>
                </section>
            ) : null}


            {/* ACG */}
            {(norm.acg?.lines || norm.acg?.advice) ? (
                <section id="acg" className="container mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <H2>Astro-cartography</H2>
                        {norm.acg?.lines ? (
                            <>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {Object.keys(norm.acg.lines).map(p => (
                                        <button key={p} onClick={() => toggle(p)} className={`px-3 py-1.5 rounded-full border text-xs ${activePlanets.includes(p) ? "bg-gradient-to-r from-fuchsia-500/70 to-purple-600/70 border-white/20" : "bg-white/5 border-white/10"}`}>{p}</button>
                                    ))}
                                </div>
                                <Card><ACGMap lines={norm.acg.lines} active={activePlanets} /></Card>
                            </>
                        ) : null}
                    </div>
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
                </section>
            ) : null}
            {(norm.acg?.places && norm.acg.places.length) ? (
                <section className="container mx-auto px-6 pb-10">
                    <H3 className="mb-3">Best places for you</H3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {norm.acg.places.map((p, i) => (
                            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <div className="flex items-start justify-between">
                                    <div className="font-semibold">{[p.city, p.country].filter(Boolean).join(", ") || "—"}</div>
                                    {typeof p.score === "number" ? <div className="text-sm text-white/80">{p.score}</div> : null}
                                </div>
                                {p.why ? <Small className="mt-2 block text-white/80">{p.why}</Small> : null}
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}


            {/* Aspects */}
            {norm.aspects?.length ? (
                <section id="aspects" className="container mx-auto px-6 pb-10">
                    <H2 className="mb-3">Aspects</H2>
                    <Card>
                        <Table head={["From", "To", "Type"]} rows={norm.aspects.map(a => [a.from, a.to, a.type])} />
                    </Card>
                </section>
            ) : null}

            {/* Yogas / Remedies / Doshas */}
            {(norm.yogas?.length || norm.remedies?.length || norm.doshas?.length) && (
                <section id="tables" className="container mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        {norm.yogas?.length ? (
                            <Card>
                                <H2 className="mb-3">Yogas</H2>
                                <ul className="space-y-2 text-sm">{norm.yogas.map((y, i) => <li key={i}><span className="font-medium">{y.title}</span> — {y.summary}</li>)}</ul>
                            </Card>
                        ) : null}
                        {norm.remedies?.length ? (
                            <Card>
                                <H2 className="mb-3">Remedies</H2>
                                <ul className="space-y-2 text-sm">{norm.remedies.map((r, i) => <li key={i}><span className="font-medium">{r.title}</span> — {r.summary}</li>)}</ul>
                            </Card>
                        ) : null}
                    </div>
                    <div className="space-y-6">
                        {norm.doshas?.length ? (
                            <Card>
                                <H2 className="mb-3">Doshas</H2>
                                <ul className="space-y-2 text-sm">{norm.doshas.map((d, i) => <li key={i}><span className="font-medium">{d.title}</span> — <span className="uppercase">{d.level}</span> {d.note ? `• ${d.note}` : ""}</li>)}</ul>
                            </Card>
                        ) : null}
                        {norm.calendar?.length ? (
                            <Card>
                                <H2 className="mb-3">Pañcāṅga</H2>
                                <Table
                                    head={["Date", "Tithi", "Nakshatra", "Yoga", "Karana"]}
                                    rows={norm.calendar.map(c => [c.date, c.tithi ?? "—", c.nakshatra ?? "—", c.yoga ?? "—", c.karana ?? "—"])}
                                />
                            </Card>
                        ) : null}
                    </div>
                </section>
            )}

            {/* Raw */}
            <section id="raw" className="container mx-auto px-6 pb-20">
                <H2 className="mb-3">Full data</H2>
                <Card><JsonExplorer data={raw} /></Card>
            </section>

            <SiteFooter />
        </div>
    );
}

// util for advice map
function toArr<T = any>(x: any): T[] { return Array.isArray(x) ? x : x ? [x] : []; }
