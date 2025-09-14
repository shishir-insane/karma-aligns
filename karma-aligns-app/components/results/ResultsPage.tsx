'use client';

import Image from "next/image";
import { useMemo, useState } from "react";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import { H1, H2, H3, Body, Small, BtnLabel } from "@/components/ui/Type";
import { normalizeCompute, type Norm } from "./normalizeCompute";

/* ------- tiny primitives ------- */
const Card = ({ children, className = "" }: React.PropsWithChildren<{className?: string}>) => (
  <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_6px_24px_rgba(99,102,241,.18)] ${className}`}>{children}</div>
);
const Chip = ({ children, on }: { children: React.ReactNode; on?: boolean }) => (
  <span className={`px-3 py-1.5 rounded-full text-xs border ${on ? 'bg-gradient-to-r from-fuchsia-500/70 to-purple-600/70 border-white/20' : 'bg-white/5 border-white/10'}`}>{children}</span>
);
const Stat = ({ label, value }: {label: string; value?: string}) => (
  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 min-w-[9rem]">
    <div className="text-xs text-white/60">{label}</div>
    <div className="mt-1 text-lg font-semibold">{value ?? "—"}</div>
  </div>
);

/* ------- bar chart ------- */
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

/* ------- heatmap (ashtakavarga) ------- */
function Heatmap({ headers = [], rows = [] as Array<{ name: string; cells: number[] }> }) {
  if (!rows?.length) return null;
  const maxV = Math.max(...rows.flatMap(r => r.cells ?? [0]), 1);
  return (
    <div className="overflow-x-auto -mx-1">
      <div className="inline-block min-w-max px-1">
        <div className="grid" style={{ gridTemplateColumns: `8rem repeat(${headers.length || (rows[0]?.cells?.length ?? 0)}, 3rem)` }}>
          <div />
          {(headers.length ? headers : Array(rows[0]?.cells?.length ?? 0).fill(null)).map((h, i) => (
            <div key={i} className="text-xs text-center text-white/60 py-1">{h ?? `C${i+1}`}</div>
          ))}
          {rows.map((r, ri) => (
            <>
              <div key={`n${ri}`} className="text-sm pr-3 py-1.5 text-white/80">{r.name}</div>
              {r.cells.map((v, ci) => {
                const pct = v / maxV;
                return (
                  <div key={`${ri}-${ci}`} className="p-1">
                    <div className="h-7 rounded-md" style={{ background: `linear-gradient(180deg, rgba(217,70,239,${0.12 + pct*0.65}) 0%, rgba(99,102,241,${0.12 + pct*0.65}) 100%)` }} />
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------- timeline (dashas / transits) ------- */
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
            const b = (new Date(it.to).getTime()   - t0) / span;
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

/* ------- placements tables ------- */
function Table({ head, rows }: { head: string[]; rows: (string|number|React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-white/70">
          <tr className="border-b border-white/10">{head.map((h,i)=><th key={i} className="text-left py-2 pr-4">{h}</th>)}</tr>
        </thead>
        <tbody className="text-white/85">
          {rows.map((r,ri)=>(
            <tr key={ri} className="border-b border-white/5">
              {r.map((c,ci)=><td key={ci} className="py-2 pr-4">{c as any}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------- ACG map (placeholder polylines) ------- */
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
          {[...Array(7)].map((_,i)=>(<line key={'h'+i} x1="0" y1={8*i} x2="100" y2={8*i} stroke="rgba(255,255,255,.06)" strokeWidth="0.2" />))}
          {[...Array(13)].map((_,i)=>(<line key={'v'+i} x1={8*i} y1="0" x2={8*i} y2="56" stroke="rgba(255,255,255,.06)" strokeWidth="0.2" />))}
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
function toPolyline(points?: Array<{lat:number;lon:number}>) {
  if (!points?.length) return null;
  return points.map(p=>{
    const x = ((p.lon + 180) / 360) * 100;
    const y = ((90 - (p.lat+90)) / 180) * 56;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

/* ------- MAIN ------- */
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
  data?: any;   // raw compute; we normalize here
}) {
  const norm = useMemo<Norm>(() => normalizeCompute({ ...(data||{}), acg }), [data, acg]);
  const [activePlanets, setActive] = useState<string[]>(["Jupiter","Venus","Sun"]);
  const toggle = (p: string) => setActive(s => s.includes(p) ? s.filter(x=>x!==p) : [...s, p]);

  return (
    <div className="relative min-h-screen bg-[#0b0e18] text-white">
      <SiteHeader />

      {/* Sticky sub-nav (mobile friendly) */}
      <div className="sticky top-14 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/10 border-y border-white/10">
        <div className="container mx-auto px-6 py-2 overflow-x-auto no-scrollbar flex gap-3 text-xs">
          {[
            ["overview","#overview"],["strength","#strength"],["ashtaka","#ashtaka"],["dashas","#dashas"],
            ["transits","#transits"],["map","#acg"],["yogas","#yogas"],["tables","#tables"],["raw","#raw"]
          ].map(([t,href])=>(
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
          <Stat label="Rising"   value={norm.identity?.rising} />
          <Stat label="Nakshatra" value={norm.identity?.nakshatra} />
          <Stat label="Ayanāṃśa" value={norm.identity?.ayanamsha} />
        </div>
      </section>

      {/* Strengths / Shadbala / Bhava */}
      {(norm.strengths?.length || norm.shadbala?.length || norm.bhavaBala?.length) && (
        <section id="strength" className="container mx-auto px-6 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {norm.strengths?.length ? <Card><H2 className="mb-3">Planet strengths</H2><Bars data={norm.strengths.map(s=>({label:s.body, value:s.score}))} /></Card> : null}
          {norm.shadbala?.length ? <Card><H2 className="mb-3">Shadbala</H2><Bars data={norm.shadbala.map(s=>({label:s.pillar, value:s.value}))} /></Card> : null}
          {norm.bhavaBala?.length ? <Card><H2 className="mb-3">Bhava Bala</H2><Bars data={norm.bhavaBala.map(h=>({label:`House ${h.house}`, value:h.score}))} /></Card> : null}
        </section>
      )}

      {/* Ashtakavarga */}
      {norm.ashtakavarga?.rows?.length ? (
        <section id="ashtaka" className="container mx-auto px-6 pb-10">
          <H2 className="mb-3">Ashtakavarga</H2>
          <Card><Heatmap headers={norm.ashtakavarga.headers} rows={norm.ashtakavarga.rows} /></Card>
        </section>
      ) : null}

      {/* Dasha timelines */}
      {norm.dashas?.length ? (
        <section id="dashas" className="container mx-auto px-6 pb-10">
          <H2 className="mb-3">Dasha timelines</H2>
          <div className="space-y-4">
            {norm.dashas.map((d, i) => (
              <Card key={i}><Small className="mb-2 text-white/70">{d.system}</Small><Timeline items={d.items} caption="Major periods" /></Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Transits (compact day-by-day scroller) */}
      {norm.transits?.length ? (
        <section id="transits" className="container mx-auto px-6 pb-10">
          <H2 className="mb-3">Transits</H2>
          <Card>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-2 px-2">
              {norm.transits.map((t, i) => (
                <div key={i} className="min-w-[220px] rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-white/60 mb-2">{new Date(t.date).toDateString()}</div>
                  <ul className="space-y-1 text-sm">
                    {t.hits.map((h, hi)=> <li key={hi}>• {h.body} {h.type} {h.target}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </section>
      ) : null}

      {/* Chart + Yogas / Remedies / Doshas */}
      <section id="yogas" className="container mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <Card>
          <div className="relative overflow-hidden rounded-xl group">
            <Image src={chartImg} alt="Birth chart" width={900} height={900} className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]" />
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full ring-4 ring-white/30" />
            </div>
          </div>
        </Card>
        <div className="space-y-6">
          {norm.yogas?.length ? (
            <>
              <H3>Notable Yogas</H3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {norm.yogas.slice(0,8).map((y, i)=>(
                  <Card key={i} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{y.title}</div>
                      {y.tag && <Chip>{y.tag}</Chip>}
                    </div>
                    <Small className="mt-2">{y.summary}</Small>
                  </Card>
                ))}
              </div>
            </>
          ) : null}

          {norm.remedies?.length ? (
            <>
              <H3>Remedies</H3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {norm.remedies.map((r,i)=>(
                  <Card key={i}><div className="font-semibold">{r.title}</div><Small className="mt-2">{r.summary}</Small></Card>
                ))}
              </div>
            </>
          ) : null}

          {norm.doshas?.length ? (
            <>
              <H3>Doshas</H3>
              <div className="flex flex-wrap gap-2">
                {norm.doshas.map((d,i)=>(
                  <Chip key={i} on>{d.title} • {d.level}</Chip>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* ACG map */}
      {(norm.acg?.lines && Object.keys(norm.acg.lines).length) ? (
        <section id="acg" className="container mx-auto px-6 pb-12">
          <H2 className="mb-3">Relocation & lines</H2>
          <Card>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(norm.acg.lines).map(p => (
                <button key={p} onClick={()=>setActive(p)} className="px-3 py-1.5 rounded-full border text-sm transition bg-white/5 border-white/10 hover:bg-white/8">
                  <span className={activePlanets.includes(p) ? "font-semibold" : ""}>{p}</span>
                </button>
              ))}
            </div>
            <ACGMap lines={norm.acg.lines} active={activePlanets} />
            <Small className="mt-3 block text-white/60">ASC = growth/identity • DSC = relationships</Small>
          </Card>
        </section>
      ) : null}

      {/* Tables: placements & houses */}
      {(norm.positions?.length || norm.houses?.length) && (
        <section id="tables" className="container mx-auto px-6 pb-16 grid grid-cols-1 xl:grid-cols-2 gap-6">
          {norm.positions?.length ? (
            <Card>
              <H2 className="mb-3">Full placements</H2>
              <Table
                head={["Body","Sign","Degree","House","Retro"]}
                rows={norm.positions.map(p=>[p.body,p.sign,`${p.degree.toFixed(2)}°`,p.house ?? "—", p.retro ? "℞" : "—"])}
              />
            </Card>
          ) : null}
          {norm.houses?.length ? (
            <Card>
              <H2 className="mb-3">Houses</H2>
              <Table
                head={["House","Sign","Lord","Degree"]}
                rows={norm.houses.map(h=>[h.house, h.sign ?? "—", h.lord ?? "—", h.degree ? `${h.degree}°` : "—"])}
              />
            </Card>
          ) : null}
        </section>
      )}

      {/* Raw data (dev / power users) */}
      <section id="raw" className="container mx-auto px-6 pb-24">
        <details className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <summary className="cursor-pointer text-sm text-white/80">Show raw data</summary>
          <pre className="mt-3 text-xs text-white/70 overflow-x-auto">{JSON.stringify(norm.raw ?? data ?? {}, null, 2)}</pre>
        </details>
      </section>

      <SiteFooter />
    </div>
  );
}
