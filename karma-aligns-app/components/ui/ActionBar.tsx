"use client";
import * as React from "react";

/**
 * Mobile-first action bar:
 * - <md: horizontal scroll rail (no scrollbar)
 * - >=md: inline row
 * - wrap fallback if scroll is disabled by container
 */
export default function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-full">
      <div
        className={[
          // rail on small screens
          "-mx-2 px-2 md:mx-0 md:px-0",
          "overflow-x-auto md:overflow-visible no-scrollbar",
          "snap-x snap-mandatory md:snap-none",
        ].join(" ")}
      >
        <div
          className={[
            // keep items in one line for the rail; allow wrap as a fallback
            "flex items-center gap-2 md:gap-3",
            "min-w-max md:min-w-0",
            "flex-nowrap md:flex-nowrap",
          ].join(" ")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
