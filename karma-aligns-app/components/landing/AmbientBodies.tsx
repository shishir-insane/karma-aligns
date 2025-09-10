import React from "react";
export default function AmbientBodies() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 animate-ambient-bodies-subtle">
      <div className="absolute right-16 top-10 h-2 w-2 rounded-full bg-sky-200/90 star-twinkle" />
      <div className="absolute right-24 top-28 h-1.5 w-1.5 rounded-full bg-fuchsia-200/90 star-twinkle d1" />
      <div className="absolute right-40 top-40 h-3 w-3 rounded-full bg-amber-200/90 star-twinkle d2" />
      <div className="absolute left-24 bottom-24 h-1.5 w-1.5 rounded-full bg-blue-200/90 star-twinkle d3" />
    </div>
  );
}