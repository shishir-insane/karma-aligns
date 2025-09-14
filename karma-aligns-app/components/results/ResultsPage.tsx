'use client';

import Image from "next/image";
import { useMemo, useState } from "react";
import SiteHeader from "@/components/landing/SiteHeader";
import SiteFooter from "@/components/landing/SiteFooter";
import { H1, H2, H3, Body, Small, BtnLabel } from "@/components/ui/Type";

/** Shape hints; everything is optional so the UI never crashes. */
type ComputeResult = {
  basics?: { sun?: string; moon?: string; rising?: string; nakshatra?: string; ayanamsha?: string };
  positions?: Array<{ body: string; sign: string; degree: number; house?: number; retro?: boolean }>;
  strengths?: Array<{ body: string; score: number }>;                  // 0..10 or 0..100
  bhava?: Array<{ house: number; score: number }>;
  ashtakavarga?: { headers?: string[]; rows?: Array<{ name: string; cells: number[] }> };
  dashas?: Array<{ system: string; items: Array<{ name: string; from: string; to: string; strength?: number }> }>;
  aspects?: Array<{ from: string; to: string; type: string }>;
  yogas?: Array<{ title: string; summary: string; tag?: string }>;
  notes?: Array<{ title: string; bullets: string[] }>;
  acg?: {
    advice?: Record<string, string[]>;
    lines?: Record<string, { ASC?: Array<{lat:number;lon:number}>, DSC?: Array<{lat:number;lon:number}> }>;
  };
};

/* ========== tiny UI helpers ========== */
const Card = ({ children, className = "" }: React.PropsWithChildren<{className?: string}>) => (
  <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_6px_24px_rgba(99,102,241,.18)] ${className}`}>{children}</div>
);

const Stat = ({ label, value }: {label: string; value?: string}) => (
  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 min-w-[9rem]">
    <div className="text-xs text-white/60">{label}</div>
    <div className="mt-1 text-lg font-semibold">{value ?? "—"}</div>
  </div>
);

/* ========== bar chart (SVG, no deps) ========== */
function BarChart({ data, max = undefined }: { data: Array<{ label: string; value: number }>; max?: number }) {
  if (!data?.length) return null;
  const vmax = max ?? Math.max(...data.map(d => d.value || 0), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span className="truncate">{d.label}</span>
            <span>{d.value.toFixed(2)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600"
              style={{ width: `${Math.min(100, (d.value / vmax) * 100)}%` }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========== heatmap (ashtakavarga) ========== */
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
            <FragmentRow key={ri} name={r.name} cells={r.cells} maxV={maxV} />
          ))}
        </div>
      </div>
    </div>
  );
}
function FragmentRow({ name, cells, maxV }: { name: string; cells: number[]; maxV: number }) {
  return (
    <>
      <div className="text-sm pr-3 py-1.5 text-white/80">{name}</div>
      {cells.map((v, ci) => {
        const pct = v / maxV;
        return (
          <div key={ci} className="p-1">
            <div
              title={`${name} • ${v}`}
              className="h-7 rounded-md"
              style={{ background: `linear-gradient(180deg, rgba(217,70,239,${0.12 + pct*0.65}) 0%, rgba(99,102,241,${0.12 + pct*0.65}) 100%)` }}
            />
          </div>
        );
      })}
    </>
  );
}

/* ========== timeline (dashas / transits) ========== */
function Timeline({ items, caption }: { items: Array<{ name: string; from: string; to: string; strength?: number }>; caption?: string }) {
  if (!items?.length) return null;
  // Normalize dates → positions in a single row (horizontal scroll on mobile).
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
              <div
                key={i}
                className="absolute top-3 h-7 rounded-lg text-[11px] leading-7 text-center text-white/90"
                style={{
                  left, width,
                  background: "linear-gradient(90deg, rgba(236,72,153,.55), rgba(147,51,234,.55))",
                  boxShadow: "0 4px 14px rgba(168,85,247,.25)"
                }}
                title={`${it.name}: ${it.from} → ${it.to}`}
              >
                {it.name}
              </div>
            );
          })}
          {/* timeline axis */}
          <div className="absolute left-0 right-0 bottom-1 text-[10px] text-white/50 flex justify-between px-2">
            <span>{new Date(items[0].from).toLocaleDateString()}</span>
            <span>{new Date(items[items.length - 1].to).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== table ========== */
function PlacementsTable({ items = [] as Array<{ body: string; sign: string; degree: number; house?: number; retro?: boolean }> }) {
  if (!items?.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-white/70">
          <tr className="border-b border-white/10">
            <th className="text-left py-2 pr-4">Body</th>
            <th className="text-left py-2 pr-4">Sign</th>
            <th className="text-left py-2 pr-4">Degree</th>
            <th className="text-left py-2 pr-4">House</th>
            <th className="text-left py-2 pr-4">Retro</th>
          </tr>
        </thead>
        <tbody className="text-white/85">
          {items.map((p, i) => (
            <tr key={i} className="border-b border-white/5">
              <td className="py-2 pr-4">{p.body}</td>
              <td className="py-2 pr-4">{p.sign}</td>
              <td className="py-2 pr-4">{p.degree.toFixed(2)}°</td>
              <td className="py-2 pr-4">{p.house ?? "—"}</td>
              <td className="py-2 pr-4">{p.retro ? "℞" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ========== ACG map (keep your previous placeholder) ========== */
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

/* ========== MAIN PAGE ========== */
export default function ResultsPage({
  name = 'Guest',
  birth = { date: '', time: '', tz: '', location: '' },
  chartImg = '/sample-chart.png',
  acg,
  data // full compute result if you pass it (optional)
}: {
  name?: string;
  birth?: { date: string; time: string; tz: string; location: string };
  chartImg?: string;
  acg?: ComputeResult["acg"];
  data?: ComputeResult;        // pass full result if available
}) {
  const [activePlanets, setActivePlanets] = useState<string[]>(["Jupiter","Venus","Sun"]);
  const toggle = (p: string) => setActivePlanets(s => s.includes(p) ? s.filter(x=>x!==p) : [...s, p]);

  const basics = data?.basics;
  const strengths = data?.strengths;
  const bhava = data?.bhava;
  const ashtaka = data?.ashtakavarga;
  const dasha = data?.dashas?.[0]; // show first system by default
  const positions = data?.positions;

  return (
    <div className="relative min-h-screen bg-[#0b0e18] text-white">
      <SiteHeader />

      {/* Header */}
      <section className="container mx-auto px-6 pt-28 pb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <H1 className="leading-[1.05]">Chart results</H1>
            <Small className="mt-2">{name} • {birth.date} {birth.time} {birth.tz} • {birth.location}</Small>
          </div>
          <div className="flex gap-3">
            <a href="/" className="rounded-2xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-[0_8px_30px_rgba(168,85,247,.30)]"><BtnLabel>✨ Generate another</BtnLabel></a>
          </div>
        </div>
      </section>

      {/* Top stats */}
      {(basics || positions) && (
        <section className="container mx-auto px-6 pb-6">
          <div className="flex gap-3 flex-wrap">
            <Stat label="Sun sign" value={basics?.sun ?? positions?.find(p=>p.body==='Sun')?.sign} />
            <Stat label="Moon sign" value={basics?.moon ?? positions?.find(p=>p.body==='Moon')?.sign} />
            <Stat label="Rising"   value={basics?.rising ?? positions?.find(p=>p.body==='Ascendant')?.sign} />
            <Stat label="Ayanāṃśa" value={basics?.ayanamsha} />
          </div>
        </section>
      )}

      {/* Planet strengths */}
      {strengths?.length ? (
        <section className="container mx-auto px-6 pb-10">
          <H2 className="mb-3">Strengths</H2>
          <Card><BarChart data={strengths.map(s=>({label:s.body, value:s.score}))} /></Card>
        </section>
      ) : null}

      {/* Bhava bala */}
      {bhava?.length ? (
        <section className="container mx-auto px-6 pb-10">
          <H2 className="mb-3">Bhava Bala</H2>
          <Card><BarChart data={bhava.map(h=>({label:`House ${h.house}`, value:h.score}))} /></Card>
        </section>
      ) : null}

      {/* Ashtakavarga heatmap */}
      {ashtaka?.rows?.length ? (
        <section className="container mx-auto px-6 pb-10">
          <H2 className="mb-3">Ashtakavarga</H2>
          <Card><Heatmap headers={ashtaka.headers} rows={ashtaka.rows} /></Card>
        </section>
      ) : null}

      {/* Dasha timeline */}
      {dasha?.items?.length ? (
        <section className="container mx-auto px-6 pb-10">
          <H2 className="mb-3">Dasha timelines</H2>
          <Card>
            <Small className="mb-2 text-white/70">{dasha.system}</Small>
            <Timeline items={dasha.items} caption="Major periods" />
          </Card>
        </section>
      ) : null}

      {/* Chart + Insights */}
      <section className="container mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <Card>
          <div className="relative overflow-hidden rounded-xl group">
            <Image src={chartImg} alt="Birth chart" width={900} height={900} className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]" />
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full ring-4 ring-white/30" />
            </div>
          </div>
        </Card>
        <div className="space-y-4">
          <H3>Insights & Yogas</H3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.yogas?.slice(0, 6).map((y, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{y.title}</div>
                  {y.tag && <span className="px-2 py-1 rounded-full text-xs bg-white/10 border border-white/15">{y.tag}</span>}
                </div>
                <Small className="mt-2">{y.summary}</Small>
              </Card>
            ))}
            {!data?.yogas?.length && (
              <Small className="text-white/70">We’ll surface notable yogas and practical tips here when available.</Small>
            )}
          </div>
        </div>
      </section>

      {/* Astrocartography */}
      {(acg?.lines && Object.keys(acg.lines).length) ? (
        <section className="container mx-auto px-6 pb-12">
          <H2 className="mb-3">Relocation & lines</H2>
          <Card>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(acg.lines).map(p => (
                <button key={p} onClick={()=>toggle(p)}
                  className={`px-3 py-1.5 rounded-full border text-sm transition ${activePlanets.includes(p) ? 'bg-gradient-to-r from-fuchsia-500/70 to-purple-600/70 border-white/20' : 'bg-white/5 border-white/10 hover:bg-white/8'}`}>
                  {p}
                </button>
              ))}
            </div>
            <ACGMap lines={acg.lines} active={activePlanets} />
            <Small className="mt-3 block text-white/60">ASC = growth/identity experiences • DSC = relationships mirror</Small>
          </Card>
        </section>
      ) : null}

      {/* Placements table */}
      {positions?.length ? (
        <section className="container mx-auto px-6 pb-20">
          <H2 className="mb-3">Full placements</H2>
          <Card><PlacementsTable items={positions} /></Card>
        </section>
      ) : null}

      <SiteFooter />
    </div>
  );
}
