import React from "react";
export default function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
    return (
        <label htmlFor={htmlFor} className="space-y-1">
            <div className="text-xs font-medium text-slate-300/90">{label}</div>
            {children}
            {hint ? <div className="text-[10px] text-slate-400">{hint}</div> : null}
        </label>
    );
}