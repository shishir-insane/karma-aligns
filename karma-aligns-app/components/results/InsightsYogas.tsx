"use client";

import React from "react";

export type InsightsPayload = {
  predictions: Record<string, string[]>;
  categories: Partial<Record<"Wealth"|"Relationships"|"Learning"|"Health", string[]>>;
  yogas: string[];
};

export default function InsightsYogas({ data }: { data: InsightsPayload }) {
  const cats = data.categories || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Predictions by category */}
      {Object.entries(data.predictions || {}).map(([k, arr]) => (
        <div key={k} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
          <div className="mb-2 text-sky-200">{k}</div>
          <ul className="space-y-1 text-sm text-slate-300 list-disc pl-5">
            {(arr || []).map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      ))}

      {/* Yogas */}
      {data.yogas?.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
          <div className="mb-2 text-sky-200">Special Yogas</div>
          <ul className="space-y-1 text-sm text-slate-300 list-disc pl-5">
            {data.yogas.map((y, i) => <li key={i}>{y}</li>)}
          </ul>
        </div>
      ) : null}

      {/* Quick chips for core categories */}
      {Object.entries(cats).map(([k, arr]) => (
        <div key={k} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
          <div className="mb-2 text-sky-200">{k}</div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {(arr || []).map((t, i) => (
              <span key={i} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">{t}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
