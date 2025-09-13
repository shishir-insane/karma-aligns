"use client";

import { useEffect, useState } from "react";

type Props = {
  /** Section id to scroll to when clicked (defaults to the birth form). */
  targetId?: string;
  /** Show the CTA after this % of page is scrolled (0–1). Default 0.4 (40%). */
  showAfter?: number;
};

export default function FloatingCTA({ targetId = "birth-form", showAfter = 0.4 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const formEl = document.getElementById(targetId);

    // Hide CTA while the target section is on screen
    const io = new IntersectionObserver(
      (entries) => {
        const onScreen = entries.some((e) => e.isIntersecting);
        if (onScreen) setVisible(false);
      },
      { rootMargin: "0px 0px -40% 0px", threshold: 0.1 }
    );
    if (formEl) io.observe(formEl);

    const onScroll = () => {
      const h = document.documentElement;
      const progress = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight);
      setVisible(progress > showAfter);
    };

    onScroll(); // set initial state
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, [targetId, showAfter]);

  const scrollToTarget = () => {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-5 z-50 flex justify-center transition-all duration-300
                  ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
    >
      <button
        onClick={scrollToTarget}
        className="rounded-full px-6 py-3 text-sm font-semibold shadow-xl ring-1 ring-white/20
                   bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white hover:opacity-95
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300 ripple"
        aria-label="Generate my chart"
      >
        ✨ Generate My Chart
      </button>
    </div>
  );
}