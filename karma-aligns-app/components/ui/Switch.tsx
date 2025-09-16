import * as React from "react";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "checked"> {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  label?: string;
}

/** KA-UI Switch: minimal, Shadbala-style, accessible */
export default function Switch({ checked, onCheckedChange, className = "", label, ...rest }: SwitchProps) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className={[
        "inline-flex items-center gap-2 cursor-pointer select-none",
        className,
      ].join(" ")}
    >
      {label && <span className="text-white/80 text-sm">{label}</span>}
      <span
        className={[
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-emerald-500/80" : "bg-white/15",
          "ring-1 ring-inset ring-white/10",
        ].join(" ")}
      >
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="peer sr-only"
          {...rest}
        />
        <span
          className={[
            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
            "shadow-[0_1px_4px_rgba(0,0,0,.25)]",
          ].join(" ")}
        />
      </span>
    </label>
  );
}
