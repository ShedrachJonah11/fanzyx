"use client";

import { cn } from "@/lib/utils";

type TabItem = { value: string; label: string };

type Props = {
  items: TabItem[];
  value: string;
  onValueChange: (v: string) => void;
  className?: string;
};

export function FeedTabs({ items, value, onValueChange, className }: Props) {
  return (
    <div className={cn("pb-3", className)}>
    <div
      role="tablist"
      className="feed-tabs relative flex items-stretch border-b border-white/[0.06]"
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
              "relative flex-1 h-11 text-[14px] font-medium transition-colors",
              active ? "text-white" : "text-white/55 hover:text-white/85"
            )}
          >
            {item.label}
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-[2px] h-[2px] bg-gradient-brand"
              />
            ) : null}
          </button>
        );
      })}
    </div>
    </div>
  );
}
