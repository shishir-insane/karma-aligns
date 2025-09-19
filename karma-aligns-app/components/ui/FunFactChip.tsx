"use client";
import * as React from "react";

export default function FunFactChip({
  facts,
  className = "",
  autoRotateMs = 0, // 0 = off
}: {
  facts: string[];
  className?: string;
  autoRotateMs?: number;
}) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    if (!autoRotateMs) return;
    const t = setInterval(() => setI((p) => (p + 1) % facts.length), autoRotateMs);
    return () => clearInterval(t);
  }, [autoRotateMs, facts.length]);
  return (
    <button
      onClick={() => setI((p) => (p + 1) % facts.length)}
      className={[
        "block w-full sm:w-auto",
        "text-[11px] rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-white/80 hover:bg-white/10",
        "whitespace-normal break-words text-left",
        className,
      ].join(" ")}
      title="Tap for another fun fact"
    >
      {facts[i] ?? ""}
    </button>
  );
}
