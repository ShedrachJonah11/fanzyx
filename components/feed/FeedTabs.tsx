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
    <div
      role="tablist"
      className={cn(
        "feed-tabs relative flex items-stretch border-b border-white/[0.06]",
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
              "relative flex-1 h-11 text-[14px] font-medium transition-colors",
              active ? "text-white" : "text-white/55 hover:text-white/85"
            )}
          >
            {item.label}
            {active ? (
              <span
                aria-hidden
                className="absolute inset-x-4 sm:inset-x-6 bottom-[-1px] h-[2px] rounded-full bg-gradient-brand"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
