import * as React from "react";

/**
 * Click-to-open tooltip (mobile-friendly).
 * - Only one tooltip open at a time (simple event bus).
 * - Closes on click-away or Escape.
 */
export interface TooltipProps {
  children: React.ReactNode;    // trigger node
  content: React.ReactNode;     // tooltip body
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
}

let tooltipCounter = 0;

export default function Tooltip({ children, content, className = "", side = "top" }: TooltipProps) {
  const idRef = React.useRef(++tooltipCounter);
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  const popRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onGlobalOpen(e: CustomEvent) {
      if (e.detail !== idRef.current) setOpen(false);
    }
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !popRef.current?.contains(t)) setOpen(false);
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
    const ev = new CustomEvent("ka:tooltip:open", { detail: idRef.current });
    document.dispatchEvent(ev);
    setOpen((o) => !o);
  };

  const sideClass =
    side === "top"
      ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
      : side === "bottom"
      ? "top-full mt-2 left-1/2 -translate-x-1/2"
      : side === "left"
      ? "right-full mr-2 top-1/2 -translate-y-1/2"
      : "left-full ml-2 top-1/2 -translate-y-1/2";

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
      >
        ?
      </div>

      {open && (
        <div
          ref={popRef}
          className={`absolute z-50 ${sideClass} max-w-xs rounded-lg border border-white/10 bg-zinc-900/95 p-2 text-xs text-white/80 shadow-xl`}
          role="dialog"
        >
          {content}
        </div>
      )}
    </div>
  );
}
