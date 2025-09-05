import React from "react";
export default function AmbientBodies() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute right-16 top-10 h-2 w-2 animate-pulse rounded-full bg-sky-200/90" />
            <div className="absolute right-24 top-28 h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-200/90 [animation-delay:1.2s]" />
            <div className="absolute right-40 top-40 h-3 w-3 animate-pulse rounded-full bg-amber-200/90 [animation-delay:2.1s]" />
        </div>
    );
}