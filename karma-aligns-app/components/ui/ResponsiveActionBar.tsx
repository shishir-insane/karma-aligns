"use client";
import * as React from "react";
import MoreMenu from "@/components/ui/MoreMenu";

/**
 * Usage:
 * <ResponsiveActionBar>
 *   <div>Critical (never collapses)</div>
 *   <div data-collapsible>Can collapse</div>
 *   <div data-collapsible>Can collapse</div>
 * </ResponsiveActionBar>
 *
 * Behavior:
 * - Measures container width vs item widths (including gap)
 * - Hides trailing items marked with `data-collapsible` until it fits
 * - Hidden items appear inside a ⋯ More menu
 */
export default function ResponsiveActionBar({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const railRef = React.useRef<HTMLDivElement>(null);

  const all = React.Children.toArray(children) as React.ReactElement[];
  const [hiddenCount, setHiddenCount] = React.useState(0);

  const recompute = React.useCallback(() => {
    const container = containerRef.current;
    const rail = railRef.current;
    if (!container || !rail) return;

    const nodes = Array.from(rail.children) as HTMLElement[];
    if (nodes.length === 0) {
      if (hiddenCount !== 0) setHiddenCount(0);
      return;
    }

    // Compute horizontal gap between items
    const styles = window.getComputedStyle(rail);
    const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;

    // Measure each child width
    const widths = nodes.map((node) => node.getBoundingClientRect().width);

    // Figure out which indices are collapsible (based on React children)
    const collapsibleIdx = all
      .map((el, i) => (React.isValidElement(el) && el.props?.["data-collapsible"] !== undefined ? i : -1))
      .filter((i) => i >= 0);

    // Total width if we show everything (including gaps)
    const totalItems = widths.length;
    const totalWidth = widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, totalItems - 1);

    const available = container.clientWidth;

    if (totalWidth <= available || collapsibleIdx.length === 0) {
      // Nothing to hide
      if (hiddenCount !== 0) setHiddenCount(0);
      return;
    }

    // Hide trailing collapsible items until it fits
    // Start from the LAST collapsible index
    let hideN = 0;
    let currentWidth = totalWidth;

    for (let ci = collapsibleIdx.length - 1; ci >= 0; ci--) {
      const idxToHide = collapsibleIdx[ci];
      // subtract the item's width
      currentWidth -= widths[idxToHide];
      // subtract one gap (removing an item removes one inter-item gap)
      currentWidth -= gap;
      hideN++;

      if (currentWidth <= available) break;
    }

    const bounded = Math.min(hideN, collapsibleIdx.length);
    if (bounded !== hiddenCount) setHiddenCount(bounded);
  }, [all, hiddenCount]);

  React.useLayoutEffect(() => {
    recompute();
  }, [recompute, all.length]);

  React.useEffect(() => {
    const ro = new ResizeObserver(() => recompute());
    if (containerRef.current) ro.observe(containerRef.current);
    if (railRef.current) ro.observe(railRef.current);
    const onResize = () => recompute();
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [recompute]);

  // Build visible/hidden sets
  const collapsibleIdx = all
    .map((el, i) => (React.isValidElement(el) && el.props?.["data-collapsible"] !== undefined ? i : -1))
    .filter((i) => i >= 0);

  const toHide = new Set(collapsibleIdx.slice(-hiddenCount));
  const visible = all.filter((_, i) => !toHide.has(i));
  const hidden = all.filter((_, i) => toHide.has(i));

  return (
    <div className="w-full max-w-full">
      <div ref={containerRef} className="-mx-2 px-2 md:mx-0 md:px-0 overflow-x-auto no-scrollbar">
        <div ref={railRef} className="flex items-center gap-2 md:gap-3">
          {visible}
          {hidden.length > 0 && (
            <MoreMenu items={<div className="flex flex-col gap-2">{hidden}</div>} label="More" />
          )}
        </div>
      </div>
    </div>
  );
}
