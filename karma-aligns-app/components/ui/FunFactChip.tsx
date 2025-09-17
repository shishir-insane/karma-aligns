"use client";
import * as React from "react";

export default function FunFactChip({ facts }: { facts: string[] }) {
  const [i, setI] = React.useState(0);
  const next = () => setI((p) => (p + 1) % facts.length);
  return (
    <button
      onClick={next}
      className="mt-2 text-[11px] rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-white/80 hover:bg-white/10"
      aria-label="Tap for another fun fact"
      title="Tap for another fun fact"
    >
      {facts[i] ?? ""}
    </button>
  );
}
