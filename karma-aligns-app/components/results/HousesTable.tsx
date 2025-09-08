"use client";

import React from "react";
import { SIGNS, signFromLon, fmtDeg } from "./astro-utils";

export default function HousesTable({ cusps }: { cusps: number[] | null }) {
  const list = Array.isArray(cusps) ? cusps : [];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
      <div className="text-xs text-slate-400 mb-2">House cusps</div>
      {list.length !== 12 ? (
        <div className="text-sm text-slate-500">No cusp data.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-sky-200/90">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">House</th>
                <th className="px-3 py-2 text-left font-semibold">Sign</th>
                <th className="px-3 py-2 text-left font-semibold">Cusp (°)</th>
              </tr>
            </thead>
            <tbody>
              {list.map((deg, i) => {
                const sIdx = signFromLon(deg) ?? 0;
                return (
                  <tr key={i} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-3 py-2">House {i+1}</td>
                    <td className="px-3 py-2 text-slate-300">{SIGNS[sIdx]}</td>
                    <td className="px-3 py-2 text-slate-300">{fmtDeg(deg)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
