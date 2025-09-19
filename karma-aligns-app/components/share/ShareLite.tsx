"use client";
import * as React from "react";
import { Copy } from "lucide-react";

export default function ShareLite({ text }: { text: string }) {
  const [ok, setOk] = React.useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 1300);
    } catch {}
  };
  return (
    <button
      onClick={onCopy}
      className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5"
      title="Copy summary"
    >
      <Copy className="size-3.5" />
      {ok ? "Copied!" : "Copy summary"}
    </button>
  );
}