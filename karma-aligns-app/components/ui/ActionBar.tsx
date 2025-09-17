"use client";
import * as React from "react";

/**
 * Mobile-first action bar:
 * - On small screens: horizontal scroll, snap, compact spacing
 * - On >=md: inline layout
 */
export default function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full md:w-auto">
      {/* mobile: horizontal rail */}
      <div className="-mx-2 px-2 md:mx-0 md:px-0 overflow-x-auto no-scrollbar md:overflow-visible snap-x snap-mandatory">
        <div className="flex items-center gap-2 md:gap-3 min-w-max md:min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
