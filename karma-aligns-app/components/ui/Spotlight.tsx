"use client";
import * as React from "react";
import Modal from "@/components/ui/Modal";
import ScaleBadge from "@/components/ui/ScaleBadge";
import { X } from "lucide-react";

export default function Spotlight({
  open,
  onClose,
  title,
  badgeValue,
  ring,
  bars,
  panels,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  badgeValue: number;
  ring: React.ReactNode;
  bars: React.ReactNode;
  panels?: Array<{ title: string; items: string[]; tone?: "good" | "bad" | "neutral" }>;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose}>
      <div className="rounded-xl bg-gradient-to-br from-[#1b1e27] to-[#0f1117] p-4 mb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-dim">Spotlight</div>
            <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <ScaleBadge value={badgeValue} />
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-xl border border-white/10 p-1.5 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="size-4 text-dim" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-6">
          <div className="flex flex-col items-center gap-3">{ring}</div>
          <div>{bars}</div>
        </div>
      </div>

      {panels && panels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {panels.map((p, i) => (
            <div key={i} className="ka-card p-3">
              <div className="text-sm font-medium mb-1">{p.title}</div>
              <ul
                className={[
                  "text-[13px] list-disc pl-5",
                  p.tone === "good" ? "text-emerald-300/90" : p.tone === "bad" ? "text-rose-300/90" : "text-body",
                ].join(" ")}
              >
                {p.items.map((line, j) => (
                  <li key={j}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {footer ? <div className="mt-4">{footer}</div> : null}
    </Modal>
  );
}
