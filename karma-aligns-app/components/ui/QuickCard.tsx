import * as React from "react";
import ScaleBadge from "@/components/ui/ScaleBadge";

export default function QuickCard({
  title,
  subtitle,
  score,
  className = "",
}: {
  title: string;
  subtitle: React.ReactNode;
  score: number; // drives badge only
  className?: string;
}) {
  return (
    <div
      className={[
        "snap-center min-w-[85%] sm:min-w-[360px]",
        "rounded-2xl bg-gradient-to-br from-violet-600/20 to-fuchsia-500/10",
        "border border-white/10 p-3 shadow-[0_10px_30px_rgba(147,51,234,.25)]",
        "transition-colors hover:bg-white/10",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="mt-1.5 text-[13px] text-body leading-snug">{subtitle}</div>
      <div className="flex items-center justify-between gap-2 mt-2">
        <ScaleBadge value={score} />
      </div>
    </div>
  );
}

