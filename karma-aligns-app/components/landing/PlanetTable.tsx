"use client";

import React from "react";

type PlanetEntry = { lon: number; retrograde: boolean | null; speed: number | null };
export default function PlanetTable({
  rows,
  selected,
  onHover,
}: {
  rows: [string, PlanetEntry][];
  selected: string | null;
  onHover: (name: string | null) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-sky-200/90">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Planet</th>
            <th className="px-4 py-2 text-right font-semibold">Longitude (°)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, p]) => {
            const isSel = selected === name;
            return (
              <tr
                key={name}
                onMouseEnter={() => onHover(name)}
                onMouseLeave={() => onHover(selected)} // keep current selection
                className={`border-t border-white/10 hover:bg-white/5 cursor-pointer ${isSel ? "bg-white/10" : ""}`}
              >
                <td className="px-4 py-2">{name}</td>
                <td className="px-4 py-2 text-right tabular-nums">{p.lon.toFixed(3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
