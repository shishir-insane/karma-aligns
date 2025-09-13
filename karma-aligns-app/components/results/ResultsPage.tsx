'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { H1, H2, H3, Body, Small, BtnLabel } from '@/components/ui/Type';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';

type ACG = {
  advice: Record<string, string[]>;
  lines: Record<string, { ASC?: Array<{lat:number;lon:number}>;
                          DSC?: Array<{lat:number;lon:number}>;
                          MC?: { lon:number } | Array<{lat:number;lon:number}>;
                          IC?: { lon:number } | Array<{lat:number;lon:number}> }>;
};

export default function ResultsPage({
  name = 'Sample User',
  birth = { date: '1990-01-01', time: '10:00', tz: '+00:00', location: 'Unknown' },
  chartImg = '/sample-chart.png',
  acg,
}: {
  name?: string;
  birth?: { date: string; time: string; tz: string; location: string };
  chartImg?: string;
  acg: ACG;
}) {
  const [activePlanets, setActivePlanets] = useState<string[]>(['Jupiter', 'Venus', 'Sun']);

  const planetList = useMemo(() => Object.keys(acg?.lines ?? {}), [acg]);
  const togglePlanet = (p: string) =>
    setActivePlanets(s => (s.includes(p) ? s.filter(x => x !== p) : [...s, p]));

  return (
    <div className="relative min-h-screen bg-[#0b0e18] text-white">
      {/* Stars / backdrop can be reused from landing */}
      <SiteHeader />

      {/* Header */}
      <section className="container mx-auto px-6 pt-28 pb-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <H1 className="leading-[1.05]">Your Cosmic Blueprint</H1>
            <Small className="mt-2">
              {name} • {birth.date} {birth.time} {birth.tz} • {birth.location}
            </Small>
          </div>

          <div className="flex gap-3">
            <button className="rounded-2xl px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/8">
              <BtnLabel>⬇️ Download</BtnLabel>
            </button>
            <button className="rounded-2xl px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/8">
              <BtnLabel>🔗 Share</BtnLabel>
            </button>
            <a href="/" className="rounded-2xl px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-[0_8px_30px_rgba(168,85,247,.30)]">
              <BtnLabel>✨ Generate another</BtnLabel>
            </a>
          </div>
        </div>
      </section>

      {/* Core insights */}
      <section className="container mx-auto px-6 pb-12">
        <H2 className="mb-6">Key Insights</H2>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_6px_24px_rgba(99,102,241,.18)]">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {(['Career','Love','Health','Caution'] as const).map((k) => (
              <InsightCard key={k} title={k} items={acg?.advice?.[k] ?? []} />
            ))}
          </div>
        </div>
      </section>

      {/* Chart preview */}
      <section className="container mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_6px_24px_rgba(99,102,241,.18)]">
          <div className="relative overflow-hidden rounded-xl group">
            <Image src={chartImg} alt="Birth chart" width={900} height={900}
              className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]" />
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full ring-4 ring-white/30" />
            </div>
          </div>
        </div>

        <div>
          <H3>Why this matters</H3>
          <Body className="mt-3 text-white/80">
            Your chart synthesizes planetary positions and angles at birth to reveal tendencies,
            strengths, and cycles. Use the insights below to navigate decisions with clarity.
          </Body>
          <div className="mt-6 flex gap-3">
            <a href="#acg" className="rounded-2xl px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/8">
              <BtnLabel>Explore your map</BtnLabel>
            </a>
            <a href="#details" className="rounded-2xl px-5 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-[0_8px_30px_rgba(168,85,247,.30)]">
              <BtnLabel>Dive into details</BtnLabel>
            </a>
          </div>
        </div>
      </section>

      {/* Astrocartography */}
      <section id="acg" className="container mx-auto px-6 pb-12">
        <H2 className="mb-6">Astrocartography</H2>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_6px_24px_rgba(99,102,241,.18)]">
          <div className="flex flex-wrap gap-2 mb-5">
            {planetList.map((p) => (
              <button key={p}
                onClick={() => togglePlanet(p)}
                className={`px-3 py-1.5 rounded-full border text-sm transition
                   ${activePlanets.includes(p)
                      ? 'bg-gradient-to-r from-fuchsia-500/70 to-purple-600/70 border-white/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/8'}`}
              >
                {p}
              </button>
            ))}
          </div>

          <ACGMap lines={acg?.lines ?? {}} active={activePlanets} />
          <Small className="mt-4 block text-white/60">
            Tip: Jupiter/Venus lines are often supportive; Mars/Saturn tend to be more challenging.
          </Small>
        </div>
      </section>

      {/* Details */}
      <section id="details" className="container mx-auto px-6 pb-20">
        <H2 className="mb-6">Details</H2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DetailCard title="Planetary Positions">
            <ul className="space-y-2 text-white/80">
              {/* Replace with real positions when available */}
              <li>☉ Sun — Aries 12°</li>
              <li>☾ Moon — Gemini 04°</li>
              <li>♂ Mars — …</li>
            </ul>
          </DetailCard>
          <DetailCard title="Houses">
            <ul className="space-y-2 text-white/80">
              <li>1st House — Self / Identity</li>
              <li>7th House — Partnerships</li>
              <li>10th House — Career / Reputation</li>
            </ul>
          </DetailCard>
          <DetailCard title="Aspects">
            <ul className="space-y-2 text-white/80">
              <li>☉ trine ♃ — Growth supports identity</li>
              <li>♀ square ♄ — Tension in commitments</li>
            </ul>
          </DetailCard>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <H3 className="text-white">{title}</H3>
      <ul className="mt-3 space-y-2 text-sm text-white/80">
        {items?.length ? items.map((t, i) => <li key={i}>• {t}</li>) : <li>—</li>}
      </ul>
    </div>
  );
}

function DetailCard({ title, children }: React.PropsWithChildren<{title: string}>) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_6px_24px_rgba(99,102,241,.18)]">
      <H3>{title}</H3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** Map placeholder – draws colored polylines by planet name. No external libs. */
function ACGMap({
  lines,
  active,
}: {
  lines: Record<string, { ASC?: Array<{lat:number;lon:number}>;
                          DSC?: Array<{lat:number;lon:number}>;
                          MC?: any; IC?: any; }>;
  active: string[];
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-[#0d1224]">
      <div className="aspect-[16/9]">
        {/* Background grid as a simple placeholder */}
        <svg viewBox="0 0 100 56" className="w-full h-full">
          <defs>
            <linearGradient id="pl" x1="0" x2="1">
              <stop offset="0" stopColor="#f0abfc" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          {/* lat/long grid */}
          {[...Array(7)].map((_,i)=>(
            <line key={'h'+i} x1="0" y1={8*i} x2="100" y2={8*i} stroke="rgba(255,255,255,.06)" strokeWidth="0.2" />
          ))}
          {[...Array(13)].map((_,i)=>(
            <line key={'v'+i} x1={8*i} y1="0" x2={8*i} y2="56" stroke="rgba(255,255,255,.06)" strokeWidth="0.2" />
          ))}

          {/* Draw ASC/DSC as polylines (approx projection for placeholder) */}
          {active.map((planet) => {
            const set = lines?.[planet];
            const asc = toPolyline(set?.ASC);
            const dsc = toPolyline(set?.DSC);
            return (
              <g key={planet}>
                {asc && (
                  <polyline
                    points={asc}
                    fill="none"
                    stroke="url(#pl)"
                    strokeOpacity="0.75"
                    strokeWidth="0.6"
                  />
                )}
                {dsc && (
                  <polyline
                    points={dsc}
                    fill="none"
                    stroke="#f59e0b"
                    strokeOpacity="0.7"
                    strokeWidth="0.5"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="absolute left-3 bottom-3 text-xs text-white/60">
        ASC = gradient • DSC = amber line • MC/IC shown in insights
      </div>
    </div>
  );
}

/** crude equirectangular projection -> svg coords */
function toPolyline(points?: Array<{lat:number;lon:number}>) {
  if (!points || !points.length) return null;
  return points.map(p=>{
    const x = ((p.lon + 180) / 360) * 100;     // 0..100
    const y = ((90 - (p.lat+90)) / 180) * 56;  // 0..56
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}
