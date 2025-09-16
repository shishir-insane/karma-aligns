import * as React from "react";

type Variant = "default" | "secondary" | "outline" | "success" | "danger";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  default:  "border-transparent bg-white/10 text-white",
  secondary:"border-white/10 bg-white/10 text-white/80",
  outline:  "border-white/20 text-white/80",
  success:  "border-transparent bg-emerald-600/80 text-white",
  danger:   "border-transparent bg-rose-600/80 text-white",
};

export default function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        variantClass[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
