"use client";
import * as React from "react";
import { BookOpen } from "lucide-react";

export default function ReferenceButton() {
  return (
    <a
      href="https://en.wikipedia.org/wiki/Shadbala#Bhava_Bala" // lightweight neutral reference
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5"
      title="Classical references"
    >
      <BookOpen className="size-3.5" />
      <span className="hidden sm:inline">📜 Reference</span>
      <span className="sm:hidden">📜</span>
    </a>
  );
}
