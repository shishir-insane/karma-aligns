"use client";

import React, { useMemo, useState } from "react";

type Range = { start?: string; end?: string; lord?: string; planet?: string; rasi?: string };
type TimelineShape = { MD?: Range[]; AD_current?: Range[]; PD_current?: Range[] };
type ActiveShape = { MD?: Range; AD?: Range; PD?: Range };

export type DashaSystemCompute = { active?: ActiveShape; timeline?: TimelineShape; system?: string; note?: string };
export type DashaSystems = Record<string, DashaSystemCompute>;

function parseDate(s?: string) {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? t : undefined;
}
function labelOf(e: Range) {
  return e.lord || e.planet || "";
}

export default function DashaTimeline({ systems }: { systems: DashaSystems }) {
  const keys = Object.keys(systems || {});
  const [tab, setTab] = useState<string>(keys[0] || "");
  const node = systems[tab] || {};
  const md = (node.timeline?.MD || []) as Range[];

  // compute time range for bars (fallback to equal buckets if dates missing)
  const range = useMemo(() => {
    const froms = md.map(e => parseDate(e.start)).filter(Boolean) as number[];
    const tos   = md.map(e => parseDate(e.end)).filter(Boolean) as number[];
    const min = froms.length ? Math.min(...froms) : 0;
    const max = tos.length ? Math.max(...tos) : md.length;
    return { min, max, dated: froms.length>0 && tos.length>0 };
  }, [md]);

  function pct(x?: number) {
    if (!range.dated || x === undefined) return 0;
    return ((x - range.min) / (range.max - range.min)) * 100;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
      {/* tabs */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {keys.map((k) => (
          <button
            key={k}
            className={`rounded-full px-3 py-1 border ${k===tab ? "bg-white/10 border-white/10" : "bg-white/5 border-transparent hover:bg-white/10"}`}
            onClick={() => setTab(k)}
          >
            {k}
          </button>
        ))}
      </div>

      {/* current pointers */}
      <div className="mb-3 text-xs text-slate-300">
        {node.active?.MD && <span className="mr-3">MD: <b>{labelOf(node.active.MD)}</b></span>}
        {node.active?.AD && <span className="mr-3">AD: <b>{labelOf(node.active.AD)}</b></span>}
        {node.active?.PD && <span>PD: <b>{labelOf(node.active.PD)}</b></span>}
      </div>

      {/* MD bars */}
      <div className="space-y-2">
        {md.length === 0 ? (
          <div className="text-sm text-slate-500">No timeline data.</div>
        ) : md.map((e, i) => {
          const left  = range.dated ? pct(parseDate(e.start)) : (i / md.length) * 100;
          const right = range.dated ? pct(parseDate(e.end))   : ((i+1) / md.length) * 100;
          return (
            <div key={i} className="relative h-6 rounded-md bg-white/5 overflow-hidden">
              <div className="absolute inset-y-0 bg-sky-300/25"
                   style={{ left: `${left}%`, width: `${Math.max(2, right-left)}%` }} />
              <div className="absolute inset-0 flex items-center px-2 text-[11px]">
                <span className="font-medium text-sky-100">{labelOf(e)}</span>
                {e.rasi ? <span className="ml-2 text-slate-300">({e.rasi})</span> : null}
                {e.start && e.end ? <span className="ml-auto text-slate-400">{e.start} → {e.end}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
