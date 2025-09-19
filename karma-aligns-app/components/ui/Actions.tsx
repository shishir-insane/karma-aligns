"use client";

import * as React from "react";

export function ReferenceButton({ href, children }: { href: string; children?: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-xl px-3 py-2 bg-white/5 hover:bg-white/10 transition text-sm"
    >
      {children ?? "Reference"}
    </a>
  );
}

export function ShareLite({ text, children }: { text: string; children?: React.ReactNode }) {
  const handleShare = async () => {
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as any).share({ text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        // optionally hook your toast system here
      } else {
        // very old browser fallback
        const el = document.createElement("textarea");
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
    } catch {
      // user canceled or not supported — ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-xl px-3 py-2 bg-white/5 hover:bg-white/10 transition text-sm"
    >
      {children ?? "Share"}
    </button>
  );
}

export function PrintButton({ children }: { children?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl px-3 py-2 bg-white/5 hover:bg-white/10 transition text-sm"
    >
      {children ?? "Print"}
    </button>
  );
}
