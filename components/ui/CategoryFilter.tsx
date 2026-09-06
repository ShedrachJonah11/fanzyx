"use client";

import { cn } from "@/lib/utils";

type Props = {
  categories: readonly string[];
  active: string;
  onChange: (v: string) => void;
  className?: string;
};

export function CategoryFilter({ categories, active, onChange, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {categories.map((c) => {
        const isActive = c === active;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={cn(
              "h-9 px-4 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 border",
              isActive
                ? "bg-white text-black border-white"
                : "bg-white/[0.04] text-white/75 border-white/10 hover:bg-white/[0.08] hover:text-white"
            )}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
