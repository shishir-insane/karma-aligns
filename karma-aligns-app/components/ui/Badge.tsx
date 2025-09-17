import * as React from "react";

// Tiny util to join class strings safely
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Variant = "default" | "secondary" | "outline" | "success" | "danger" | "ghost";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

/**
 * Color-agnostic Badge:
 * - Uses text-current so callers (e.g., ScaleBadge) set the text color.
 * - Variants only set border/background (no text-* utilities).
 * - Caller className is appended LAST to guarantee override.
 */
const variantClass: Record<Variant, string> = {
  default:   "border-transparent bg-white/10",
  secondary: "border-white/10 bg-white/10",
  outline:   "border-white/20",
  success:   "border-emerald-400/20 bg-emerald-600/15",
  danger:    "border-rose-400/20 bg-rose-600/15",
  ghost:     "", // bare, for full custom control
};

export default function Badge({
  className = "",
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        // base: shape + sizing + inherit text color
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs leading-none text-current",
        variantClass[variant],
        className // <- last so caller colors (e.g., text-emerald-300) win
      )}
      {...props}
    />
  );
}
