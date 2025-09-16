import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:  "bg-emerald-600/80 text-white hover:bg-emerald-600",
  secondary:"bg-white/10 text-white hover:bg-white/20",
  ghost:    "bg-transparent text-white/80 hover:bg-white/10",
  danger:   "bg-rose-600/80 text-white hover:bg-rose-600",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export default function Button({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl border border-white/10",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-white/40",
        variants[variant],
        sizes[size],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
