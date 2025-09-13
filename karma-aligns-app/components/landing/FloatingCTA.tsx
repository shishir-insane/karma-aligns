"use client";
import { useEffect, useState } from "react";
import { scrollToId } from "../utils/scroll";


export default function FloatingCTA({ targetId = "birth-form", showAfter = 0.4 }: { targetId?: string; showAfter?: number; }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const progress = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight);
      setVisible(progress > showAfter);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfter]);

  const onClick = () => scrollToId(targetId);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-5 z-50 flex justify-center transition-all duration-300
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
    >
      <button
        onClick={onClick}
        className="rounded-full px-6 py-3 text-sm font-semibold shadow-xl ring-1 ring-white/20
                   bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white hover:opacity-95
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
      >
        ✨ Generate My Chart
      </button>
    </div>
  );
}
