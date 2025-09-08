"use client";

import React, { useState } from "react";
import { SIGNS } from "./astro-utils";

export default function RashiChalit({
  rashi,
  chalit,
  ascIdx,
}: {
  rashi: string[][] | null;
  chalit: string[][] | null;
  ascIdx: number | null;
}) {
  const [tab, setTab] = useState<"rashi" | "chalit">("rashi");

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
      <div className="mb-4 flex items-center gap-2">
        <button
          className={`rounded-full px-3 py-1 text-sm border ${tab==="rashi" ? "bg-white/10 border-white/10" : "bg-white/5 border-transparent"}`}
          onClick={() => setTab("rashi")}
        >
          Rāśi (signs)
        </button>
        <button
          className={`rounded-full px-3 py-1 text-sm border ${tab==="chalit" ? "bg-white/10 border-white/10" : "bg-white/5 border-transparent"}`}
          onClick={() => setTab("chalit")}
        >
          Chalit (houses)
        </button>
        {typeof ascIdx === "number" && (
          <span className="ml-auto text-xs text-slate-400">Asc: {SIGNS[ascIdx]}</span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {(tab === "rashi" ? (rashi ?? Array.from({length:12}, () => [])) : (chalit ?? Array.from({length:12}, () => [])))
          .map((list, i) => (
            <div key={`${tab}-${i}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="text-xs text-slate-400 mb-1">
                {tab === "rashi" ? SIGNS[i] : `House ${i+1}`}
              </div>
              <div className="min-h-[28px] text-sm text-sky-100">
                {list && list.length ? (
                  <div className="flex flex-wrap gap-1">
                    {list.map((p: string) => (
                      <span key={p} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px]">{p}</span>
                    ))}
                  </div>
                ) : <span className="text-slate-500">—</span>}
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
