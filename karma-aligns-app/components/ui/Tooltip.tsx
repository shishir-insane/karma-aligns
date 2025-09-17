import * as React from "react";
import { createPortal } from "react-dom";

/**
 * Mobile-friendly tooltip that portals to <body> using fixed positioning.
 * - Click to toggle
 * - Closes on click-away / Escape
 */
export interface TooltipProps {
  children: React.ReactNode;    // trigger
  content: React.ReactNode;     // tooltip body
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  offset?: number;
}

let tooltipCounter = 0;

export default function Tooltip({
  children,
  content,
  className = "",
  side = "top",
  offset = 8,
}: TooltipProps) {
  const idRef = React.useRef(++tooltipCounter);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);
  const triggerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onGlobalOpen(e: CustomEvent) {
      if (e.detail !== idRef.current) setOpen(false);
    }
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    document.addEventListener("ka:tooltip:open" as any, onGlobalOpen as any);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("ka:tooltip:open" as any, onGlobalOpen as any);
    };
  }, []);

  const toggle = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const p =
        side === "top"
          ? { x: centerX, y: rect.top - offset }
          : side === "bottom"
          ? { x: centerX, y: rect.bottom + offset }
          : side === "left"
          ? { x: rect.left - offset, y: centerY }
          : { x: rect.right + offset, y: centerY };
      setPos(p);
    }
    const ev = new CustomEvent("ka:tooltip:open", { detail: idRef.current });
    document.dispatchEvent(ev);
    setOpen((o) => !o);
  };

  const pop = open && pos
    ? createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: side === "left" ? pos.x : side === "right" ? pos.x : pos.x,
            top: side === "top" ? pos.y : side === "bottom" ? pos.y : pos.y,
            transform:
              side === "top"
                ? "translate(-50%, -100%)"
                : side === "bottom"
                ? "translate(-50%, 0)"
                : side === "left"
                ? "translate(-100%, -50%)"
                : "translate(0, -50%)",
          }}
          role="dialog"
        >
          <div className="max-w-xs rounded-lg border border-white/10 bg-zinc-900/95 p-2 text-xs text-white/80 shadow-xl">
            {content}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`relative inline-flex ${className}`} ref={triggerRef}>
      <div
        role="button"
        tabIndex={0}
        onClick={toggle}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle()}
        className="inline-flex items-center justify-center size-5 rounded-full bg-white/10 text-white/70 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
        aria-expanded={open}
        aria-haspopup="dialog"
        style={{ zIndex: 1 }}
      >
        ?
      </div>
      {pop}
    </div>
  );
}
