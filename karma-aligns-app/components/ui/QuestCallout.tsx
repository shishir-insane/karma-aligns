import * as React from "react";
export default function QuestCallout({ text }: { text: string }) {
  return (
    <div className="mt-2 text-[11px] rounded-xl border border-amber-400/20 bg-amber-300/10 text-amber-200 px-2 py-1">
      {text}
    </div>
  );
}
