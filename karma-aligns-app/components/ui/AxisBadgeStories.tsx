"use client";
import * as React from "react";
import StickerTag from "@/components/ui/StickerTag";

export default function AxisBadgeStories({
  pairs,
}: {
  pairs: { label: string; winner?: string; tie?: boolean }[];
}) {
  if (!pairs.length) return null;
  return (
    <div className="-mx-2 px-2 sm:mx-0 sm:px-0">
      <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory">
        <div className="flex gap-2 min-w-max">
          {pairs.map((p) => (
            <div key={p.label} className="snap-start">
              <StickerTag tone={p.tie ? "violet" : "emerald"}>
                {p.tie ? "⚖️" : "↗"} {p.label}
                {!p.tie && p.winner ? ` — ${p.winner}` : ""}
              </StickerTag>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
