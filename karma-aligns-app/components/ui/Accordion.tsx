"use client";
import * as React from "react";
import { ChevronDown } from "lucide-react";

export function Accordion({
  children,
  className = "",
}: { children: React.ReactNode; className?: string }) {
  return <div className={["rounded-xl border border-white/10 divide-y divide-white/10", className].join(" ")}>{children}</div>;
}

export function AccordionItem({
  title,
  defaultOpen = false,
  children,
}: { title: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-white/5"
      >
        <span className="text-white/90">{title}</span>
        <ChevronDown className={["size-4 transition-transform", open ? "rotate-180" : ""].join(" ")} />
      </button>
      <div className={["px-3 py-2 text-sm text-white/80", open ? "block" : "hidden"].join(" ")}>{children}</div>
    </div>
  );
}
