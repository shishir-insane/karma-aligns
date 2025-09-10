"use client";

import React, { useMemo, useState } from "react";

export type VargasNode = { asc_idx?: number; houses?: string[][]; rashi?: string[][]; chalit?: string[][]; grid?: string[][] };
export type VargasData = Record<string, VargasNode>;

function Grid({ title, boxes }: { title: string; boxes: string[][] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 text-sky-200 text-sm">{title}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {boxes.map((list, i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-black/20 p-2">
            <div className="text-[11px] text-slate-400 mb-1">House {i+1}</div>
            <div className="min-h-[24px] text-sm text-sky-100 flex flex-wrap gap-1">
              {list?.length ? list.map((p) => (
                <span key={p} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px]">{p}</span>
              )) : <span className="text-slate-500">—</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VargasGrids({ vargas }: { vargas: VargasData }) {
  const keys = useMemo(() => Object.keys(vargas || {}), [vargas]);
  const [tab, setTab] = useState<string>(keys[0] || "");
  const node = (vargas || {})[tab] || {};

  // compute: prefer 'houses', else 'rashi'/'chalit'/'grid'
  const boxes = node.houses || node.rashi || node.chalit || node.grid || [];

  if (!keys.length) return null;

  return (
    <div className="ka-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {keys.map((k) => (
          <button key={k} onClick={() => setTab(k)}
                  className={`rounded-full px-3 py-1 border ${k===tab ? "bg-white/10 border-white/10" : "bg-white/5 border-transparent hover:bg-white/10"}`}>
            {k}
          </button>
        ))}
      </div>
      {Array.isArray(boxes) && boxes.length ? <Grid title={tab} boxes={boxes} /> : <div className="text-sm text-slate-500">No data.</div>}
    </div>
  );
}
