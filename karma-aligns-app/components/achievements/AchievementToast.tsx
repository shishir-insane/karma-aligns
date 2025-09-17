"use client";
import * as React from "react";

export default function AchievementToast({ text, emoji, onClose }: { text: string; emoji: string; onClose: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed left-1/2 top-4 -translate-x-1/2 z-[9999]">
      <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur px-3 py-2 text-sm shadow-[0_10px_30px_rgba(147,51,234,.25)]">
        <span className="mr-1.5">{emoji}</span>{text}
      </div>
    </div>
  );
}

