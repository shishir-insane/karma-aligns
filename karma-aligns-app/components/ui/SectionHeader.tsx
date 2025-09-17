import * as React from "react";

export default function SectionHeader({
  title,
  right,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="heading-shadow-container" data-text={typeof title === "string" ? title : undefined}>
        <h2 className="hero-heading">{title}</h2>
      </div>
      {right ? <div className="flex items-center gap-3">{right}</div> : null}
    </div>
  );
}
