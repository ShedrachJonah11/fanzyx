"use client";

import { useEffect, useRef, useState } from "react";
import {
  EyeOff,
  Flag,
  Link as LinkIcon,
  MoreHorizontal,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  onSelect?: () => void;
};

export function PostMenu({
  onShare,
  onCopyLink,
  onReport,
  onHide,
}: {
  onShare?: () => void;
  onCopyLink?: () => void;
  onReport?: () => void;
  onHide?: () => void;
} = {}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items: Item[] = [
    { label: "Share", icon: Share2, onSelect: onShare },
    { label: "Copy link", icon: LinkIcon, onSelect: onCopyLink },
    { label: "Report post", icon: Flag, danger: true, onSelect: onReport },
    { label: "Hide", icon: EyeOff, onSelect: onHide },
  ];

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Post options"
        className="text-white/50 hover:text-white p-1.5 rounded-full hover:bg-white/[0.06] transition-colors"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className="animate-fade-in absolute top-full right-0 mt-2 z-20 min-w-[180px] surface-elev rounded-[12px] p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                onClick={() => {
                  item.onSelect?.();
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2.5 transition-colors",
                  item.danger
                    ? "text-red-300 hover:bg-red-500/10 hover:text-red-200"
                    : "text-white/85 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
