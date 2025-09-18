"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

export default function MoreMenu({
  items,
  label = "More",
}: {
  items: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  // Place the menu with a fixed position so it's never clipped by overflow containers
  const place = React.useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, left: Math.min(r.right - 224, window.innerWidth - 232), width: r.width });
  }, []);

  React.useEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    const onResize = () => place();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, place]);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-2.5 py-1.5 text-xs text-dim hover:bg-white/5 relative z-50"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
      >
        <MoreHorizontal className="size-4" />
        <span className="hidden sm:inline">{label}</span>
      </button>

      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              role="menu"
              className="z-[9999] w-56 rounded-2xl border border-white/10 bg-black/40 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,.35)] p-2"
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
              }}
            >
              <div className="flex flex-col gap-2">{items}</div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
