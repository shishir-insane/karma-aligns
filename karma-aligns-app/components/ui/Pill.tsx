import * as React from "react";

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  muted?: boolean;
}

export default function Pill({ className = "", muted = false, ...props }: PillProps) {
  // Slightly softer than Badge; used for tiny chips/tags.
  const base =
    "inline-flex items-center rounded-full px-2 py-[2px] text-[11px] leading-none";
  const tone = muted ? "bg-white/5 text-white/70" : "bg-white/10 text-white/80";
  return <span className={[base, tone, className].join(" ")} {...props} />;
}
