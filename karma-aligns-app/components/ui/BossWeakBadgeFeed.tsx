"use client";
import * as React from "react";
import StickerTag from "@/components/ui/StickerTag";

export type BadgeItem = { id: number; label: string; kind: "boss" | "weak" };

export default function BossWeakBadgeFeed({ items }: { items: BadgeItem[] }) {
  if (!items?.length) return null;
  return (
    <div className="-mx-2 px-2 sm:mx-0 sm:px-0">
      <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory">
        <div className="flex gap-2 min-w-max">
          {items.map((b) => (
            <div key={`${b.kind}-${b.id}`} className="snap-start">
              <StickerTag tone={b.kind === "boss" ? "emerald" : "rose"}>
                {b.kind === "boss" ? "👑" : "🫂"} {b.label}
              </StickerTag>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
