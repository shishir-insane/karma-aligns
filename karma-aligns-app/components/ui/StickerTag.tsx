import * as React from "react";

export default function StickerTag({
  children,
  className = "",
  tone = "violet",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "violet" | "emerald" | "rose";
}) {
  const tones: Record<string, string> = {
    violet: "border-violet-400/25 bg-violet-300/10 text-violet-300",
    emerald: "border-emerald-400/25 bg-emerald-300/10 text-emerald-300",
    rose: "border-rose-400/25 bg-rose-300/10 text-rose-300",
  };
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
        tones[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
