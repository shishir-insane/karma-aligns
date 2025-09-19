"use client";

import * as React from "react";

type SectionShellProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Preferred prop (Bhava-style) */
  actions?: React.ReactNode;
  /** Back-compat alias */
  right?: React.ReactNode;
  children: React.ReactNode;

  bordered?: boolean;
  description?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  stickyHeader?: boolean;
  className?: string;
  contentClassName?: string;
  id?: string;
};

export function SectionShell({
  title,
  subtitle,
  actions,
  right,
  children,
  bordered = true,
  description,
  collapsible = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  stickyHeader = false,
  className = "",
  contentClassName = "",
  id,
}: SectionShellProps) {
  const isControlled = typeof openProp === "boolean";
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState<boolean>(defaultOpen);
  const open = isControlled ? (openProp as boolean) : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const rightSlot = actions ?? right; // prefer 'actions'

  return (
    <section
      id={id}
      className={[
        "w-full",
        bordered ? "rounded-2xl border border-white/10 bg-white/5" : "",
        className,
      ].filter(Boolean).join(" ")}
      aria-labelledby={id ? `${id}-title` : undefined}
      data-collapsible={collapsible ? "true" : "false"}
    >
      {/* Header */}
      <div
        className={[
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          stickyHeader ? "sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-black/20" : "",
          bordered ? "px-4 py-3 sm:px-5 sm:py-4" : "pb-2",
        ].join(" ")}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 id={id ? `${id}-title` : undefined} className="truncate text-lg font-semibold sm:text-xl">
              {title}
            </h2>
            {collapsible && (
              <button
                type="button"
                aria-expanded={open}
                aria-controls={id ? `${id}-panel` : undefined}
                className="rounded-lg px-2 py-1 text-xs opacity-80 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
                onClick={() => setOpen(!open)}
                title={open ? "Collapse" : "Expand"}
              >
                {open ? "−" : "+"}
              </button>
            )}
          </div>
          {subtitle ? <div className="mt-0.5 text-sm opacity-80">{subtitle}</div> : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>

      {description ? (
        <div className={["px-4 sm:px-5", bordered ? "pb-3" : "pb-2"].join(" ")}>
          <div className="text-sm opacity-80">{description}</div>
        </div>
      ) : null}

      <div id={id ? `${id}-panel` : undefined} hidden={collapsible ? !open : false}
           className={["px-4 pb-4 sm:px-5 sm:pb-5", contentClassName].join(" ")}>
        {children}
      </div>
    </section>
  );
}

export default SectionShell;
