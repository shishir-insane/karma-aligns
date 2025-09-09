"use client";

import React from "react";

export type BhavaItem = { house: number; benefic: number; malefic: number; net: number };

export default function BhavaBalaBars({ items }: { items: BhavaItem[] }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map(i => Math.max(i.benefic, i.malefic))), range = max || 1;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
      <div className="grid grid-cols-1 gap-3">
        {items.map((i) => (
          <div key={i.house}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium text-slate-200">House {i.house}</span>
              <span className="text-slate-400">net {i.net.toFixed(2)}</span>
            </div>
            <div className="relative h-3 w-full rounded-full bg-white/10 overflow-hidden">
              {/* Malefic (left, red) */}
              <div className="absolute left-1/2 h-full bg-rose-400/60" style={{ width: `${(i.malefic / range) * 50}%`, transform: "translateX(-100%)" }} />
              {/* Benefic (right, green) */}
              <div className="absolute left-1/2 h-full bg-emerald-400/70" style={{ width: `${(i.benefic / range) * 50}%` }} />
              {/* Midline */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
