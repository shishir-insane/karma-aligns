"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ACGLines } from "./ACGLinesLeafletInner";

const ACGLinesLeafletInner = dynamic(() => import("./ACGLinesLeafletInner"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-4 text-slate-300 text-sm">
      Loading map…
    </div>
  ),
}) as ComponentType<{ lines: ACGLines; advice?: Record<string, string[]> }>;

export default function ACGLinesMap({
  lines,
  advice,
}: {
  lines: ACGLines;
  advice?: Record<string, string[]>;
}) {
  return <ACGLinesLeafletInner lines={lines} advice={advice} />;
}
