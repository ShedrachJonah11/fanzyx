"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabItem = { value: string; label: string; count?: number };

type Props = {
  items: TabItem[];
  value: string;
  onValueChange: (v: string) => void;
  className?: string;
};

export function Tabs({ items, value, onValueChange, className }: Props) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.04] hairline",
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "relative h-8 px-4 rounded-full text-[13px] font-medium transition-colors",
              active
                ? "bg-gradient-brand text-white"
                : "text-white/60 hover:text-white/90"
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "ml-2 text-[11px] rounded-full px-1.5 py-0.5",
                  active ? "bg-white/20 text-white" : "bg-white/[0.06] text-white/60"
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
