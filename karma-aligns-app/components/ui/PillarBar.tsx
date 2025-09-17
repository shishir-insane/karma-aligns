import * as React from "react";
import Tooltip from "@/components/ui/Tooltip";
import { Info } from "lucide-react";

export default function PillarBar({
  label,
  value,
  tooltip,
  classical,
}: {
  label: string;
  value: number; // 0..1
  tooltip?: string;
  classical?: { virupa?: number; rupa?: number };
}) {
  const tone =
    value >= 0.7 ? "bg-emerald-500" : value >= 0.55 ? "bg-violet-500" : value >= 0.4 ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="py-1">
      <div className="flex flex-wrap items-center gap-2">
        <div className="cursor-pointer min-w-0 text-sm text-body flex items-center gap-1">
          <span className="truncate">{label}</span>
          {tooltip && (
            <Tooltip content={tooltip}>
              <Info className="size-3.5 text-faint" />
            </Tooltip>
          )}
        </div>
        <div className="text-xs tabular-nums text-body">{(value * 100).toFixed(1)}%</div>
        {classical && (
          <div className="text-xs text-dim">
            {classical.virupa != null && `${Math.round(classical.virupa)} v • `}
            {classical.rupa != null && `${(classical.rupa as number).toFixed(2)} r`}
          </div>
        )}
      </div>
      <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}
