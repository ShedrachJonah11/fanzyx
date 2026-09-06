"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchBar({ value, onChange, placeholder = "Search…", className }: Props) {
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/45" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 rounded-[14px] bg-white/[0.04] hairline text-[14px] text-white placeholder:text-white/40 pl-11 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
      />
    </div>
  );
}
