"use client";
import * as React from "react";
import { Printer } from "lucide-react";

export default function PrintButton({ label = "Print / PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => typeof window !== "undefined" && window.print()}
      className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5"
      title="Print or save as PDF"
    >
      <Printer className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">PDF</span>
    </button>
  );
}
