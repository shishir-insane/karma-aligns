"use client";

import React from "react";

export type ShadbalaItem = {
  planet: string;
  total: number;
  components?: Record<string, number>;
};

export default function ShadbalaBars({ items }: { items: ShadbalaItem[] }) {
  if (!items?.length) return null;
  const max = Math.max(...items.map(i => i.total || 0), 1);

  return (
    <div className="ka-card p-4">
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.planet}>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium text-slate-200">{i.planet}</span>
              <span>{i.total.toFixed(2)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-300/80 to-fuchsia-300/80"
                style={{ width: `${(i.total / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {/* Optional component tooltips could be added later */}
    </div>
  );
}
