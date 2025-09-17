import * as React from "react";

export default function SpokeWheel({
  count,
  values,
  onSelect,
  size = 320,
  innerRatio = 0.45,
  outerRatio = 0.96,
  fillForIndex,
  labelForIndex,
}: {
  count: number;
  values: number[]; // 0..1 per wedge
  onSelect?: (i: number) => void;
  size?: number;
  innerRatio?: number;
  outerRatio?: number;
  fillForIndex: (i: number, v: number) => string; // tailwind fill class
  labelForIndex?: (i: number) => string | number;
}) {
  const r = size / 2;
  const inner = r * innerRatio;
  const outer = r * outerRatio;
  const per = (Math.PI * 2) / count;
  const toXY = (ang: number, radius: number) => ({ x: r + Math.cos(ang) * radius, y: r + Math.sin(ang) * radius });

  return (
    <div className="relative mx-auto overflow-visible">
      <svg width={size} height={size} className="block overflow-visible">
        {Array.from({ length: count }, (_, i) => {
          const v = values[i] ?? 0;
          const start = -Math.PI / 2 + i * per;
          const end = start + per;
          const mid = (start + end) / 2;
          const A = toXY(start, inner);
          const B = toXY(start, outer);
          const C = toXY(end, outer);
          const D = toXY(end, inner);
          const path = `M ${A.x} ${A.y} L ${B.x} ${B.y} A ${outer} ${outer} 0 0 1 ${C.x} ${C.y} L ${D.x} ${D.y} A ${inner} ${inner} 0 0 0 ${A.x} ${A.y} Z`;
          const fill = fillForIndex(i, v);
          return (
            <g key={i} className="cursor-pointer" onClick={() => onSelect?.(i + 1)}>
              <path d={path} className={`${fill} stroke-white/12`} />
              <text
                x={toXY(mid, (inner + outer) / 2).x}
                y={toXY(mid, (inner + outer) / 2).y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="select-none text-[12px] fill-white"
              >
                {labelForIndex ? labelForIndex(i) : i + 1}
              </text>
            </g>
          );
        })}
        <circle cx={r} cy={r} r={3} className="fill-white/60" />
      </svg>
    </div>
  );
}
