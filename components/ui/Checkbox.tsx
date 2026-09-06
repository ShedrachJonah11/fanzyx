"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  id?: string;
  className?: string;
};

export function Checkbox({ checked, onChange, label, id, className }: Props) {
  const generatedId = React.useId();
  const cid = id ?? generatedId;
  return (
    <label
      htmlFor={cid}
      className={cn(
        "flex items-start gap-3 cursor-pointer group select-none",
        className
      )}
    >
      <span className="relative inline-flex items-center justify-center mt-0.5 shrink-0">
        <input
          id={cid}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "size-[18px] rounded-[6px] border transition-all",
            checked
              ? "bg-gradient-brand border-transparent shadow-[0_4px_16px_-4px_rgba(105,41,252,0.55)]"
              : "border-white/20 bg-white/[0.04] group-hover:border-white/35"
          )}
        />
        {checked ? (
          <Check
            className="absolute size-3 text-white pointer-events-none"
            strokeWidth={3}
          />
        ) : null}
      </span>
      <span className="text-[12px] text-white/70 leading-relaxed flex-1">
        {label}
      </span>
    </label>
  );
}
