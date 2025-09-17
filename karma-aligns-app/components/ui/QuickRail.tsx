import * as React from "react";

export default function QuickRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-2 px-2 overflow-x-auto snap-x snap-mandatory no-scrollbar">
      <div className="flex gap-3">{children}</div>
    </div>
  );
}
