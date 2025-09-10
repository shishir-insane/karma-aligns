"use client";

import React, { useMemo, useState } from "react";

export type AspectEdge = {
  angle: number; from: string; to: string; kind: "full" | "special" | string; orb: number;
};

export default function AspectsList({ aspects }: { aspects: AspectEdge[] }) {
  const [filter, setFilter] = useState<"all" | "full" | "special">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return aspects;
    return aspects.filter(a => String(a.kind).toLowerCase() === filter);
  }, [aspects, filter]);

  const counts = useMemo(() => {
    const full = aspects.filter(a => String(a.kind).toLowerCase() === "full").length;
    const special = aspects.filter(a => String(a.kind).toLowerCase() === "special").length;
    return { full, special, all: aspects.length };
  }, [aspects]);

  return (
    <section className="ka-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="text-xs text-slate-400">Aspects</div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button
            className={`rounded-full px-2 py-0.5 border ${filter==="all" ? "bg-white/10 border-white/10" : "bg-white/5 border-transparent"}`}
            onClick={() => setFilter("all")}
          >
            All {counts.all}
          </button>
          <button
            className={`rounded-full px-2 py-0.5 border ${filter==="full" ? "bg-white/10 border-white/10" : "bg-white/5 border-transparent"}`}
            onClick={() => setFilter("full")}
          >
            Full {counts.full}
          </button>
          <button
            className={`rounded-full px-2 py-0.5 border ${filter==="special" ? "bg-white/10 border-white/10" : "bg-white/5 border-transparent"}`}
            onClick={() => setFilter("special")}
          >
            Special {counts.special}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-sm text-slate-500">No aspects for this filter.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((a, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-slate-200 text-sm">
                <strong>{a.from}</strong>
                <span className="mx-1 text-slate-500">→</span>
                <strong>{a.to}</strong>
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {a.kind} • angle {a.angle.toFixed(0)}° • orb {a.orb.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
