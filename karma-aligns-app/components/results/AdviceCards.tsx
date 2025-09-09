"use client";

import React from "react";
import { Heart, Briefcase, ShieldAlert, Stethoscope } from "lucide-react";

export type AdviceBuckets = {
  Career?: string[];
  Love?: string[];
  Health?: string[];
  Caution?: string[];
  [k: string]: string[] | undefined;
};

function Bucket({
  title,
  icon,
  items,
  tint,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  tint: string; // tailwind class e.g. "from-emerald-400/20"
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-5 hover:bg-white/[0.06] transition">
      <div className="flex items-center gap-2 text-slate-200 mb-3">
        <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${tint}`}>
          {icon}
        </div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm text-slate-300 list-disc pl-5">
        {items.map((line, idx) => (
          <li key={idx} className="leading-snug">{line}</li>
        ))}
      </ul>
    </div>
  );
}

export default function AdviceCards({ advice }: { advice: AdviceBuckets }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Bucket
        title="Career"
        icon={<Briefcase className="h-4 w-4" />}
        items={advice.Career ?? []}
        tint="from-amber-400/25 to-orange-400/15 text-amber-200"
      />
      <Bucket
        title="Love"
        icon={<Heart className="h-4 w-4" />}
        items={advice.Love ?? []}
        tint="from-pink-400/25 to-fuchsia-400/15 text-pink-200"
      />
      <Bucket
        title="Health"
        icon={<Stethoscope className="h-4 w-4" />}
        items={advice.Health ?? []}
        tint="from-emerald-400/25 to-teal-400/15 text-emerald-200"
      />
      <Bucket
        title="Caution"
        icon={<ShieldAlert className="h-4 w-4" />}
        items={advice.Caution ?? []}
        tint="from-rose-400/25 to-red-400/15 text-rose-200"
      />
    </div>
  );
}
