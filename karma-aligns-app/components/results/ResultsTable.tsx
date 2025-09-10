"use client";

import React from "react";
import type { Placement } from "./ResultsCards";

export default function ResultsTable({ rows }: { rows: Placement[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="ka-card p-5 text-sm text-slate-500 backdrop-blur">
        No placement rows to display.
      </div>
    );
  }

  return (
    <div className="overflow-hidden ka-card">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-sky-200/90">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Planet</th>
            <th className="px-2 py-2 text-left font-semibold">⟡</th>
            <th className="px-4 py-2 text-left font-semibold">Sign</th>
            <th className="px-4 py-2 text-right font-semibold">Degree</th>
            <th className="px-4 py-2 text-right font-semibold">House</th>
            <th className="px-4 py-2 text-left font-semibold">Nakshatra (Pada)</th>
            <th className="px-4 py-2 text-left font-semibold">Sign Lord</th>
            <th className="px-4 py-2 text-left font-semibold">Retro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.planet} className="border-t border-white/10 hover:bg-white/5">
              <td className="px-4 py-2 text-slate-200">{r.planet || "—"}</td>
              <td className="px-2 py-2">{r.symbol || "—"}</td>
              <td className="px-4 py-2 text-slate-300">{r.sign || "—"}</td>
              <td className="px-4 py-2 text-right tabular-nums">{r.degree || "—"}</td>
              <td className="px-4 py-2 text-right">{Number.isFinite(r.house) && r.house !== 0 ? r.house : "—"}</td>
              <td className="px-4 py-2 text-slate-300">
                {r.nakshatra
                  ? <>{r.nakshatra} <span className="text-slate-400">(Pada {r.nakshatraPada || "—"})</span></>
                  : (r.nakshatraPada ? <span className="text-slate-400">Pada {r.nakshatraPada}</span> : "—")
                }
              </td>
              <td className="px-4 py-2 text-slate-300">{r.signLord || "—"}</td>
              <td className="px-4 py-2">{r.retrograde ? "R" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
