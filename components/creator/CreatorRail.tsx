"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Search } from "lucide-react";
import { SubscriberCard } from "./SubscriberCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  dashboard,
  type TopSubscribersSort,
} from "@/services/modules/dashboard";
import { ApiError } from "@/services/apiClient";
import type { TopSubscriberOut } from "@/services/dtos";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { value: TopSubscribersSort; label: string }[] = [
  { value: "spend", label: "Top Spender" },
  { value: "subs", label: "Most Subs" },
  { value: "newest", label: "Newest" },
];

const LIMIT = 7; // 1 hero + 6 grid

export function CreatorRail() {
  const [sort, setSort] = useState<TopSubscribersSort>("spend");
  const [items, setItems] = useState<TopSubscriberOut[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const res = await dashboard.topSubscribers({ sort, limit: LIMIT });
        if (cancelled) return;
        setItems(res.items);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) {
          setError(e);
          // creator_required means we're on the dashboard as a non-creator —
          // no toast, just render nothing.
          if (e.code !== "creator_required") {
            toast.error(e.detail ?? "Couldn't load subscribers");
          }
        }
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sort]);

  if (error?.code === "creator_required") return null;

  const [top, ...rest] = items ?? [];

  return (
    <aside className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1 [scrollbar-width:thin]">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
        <input
          placeholder="Search here…"
          className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-sm text-white placeholder:text-white/40 pl-10 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
        />
      </div>

      {/* Most Engaged Subscribers */}
      <section>
        <h2 className="text-[15px] font-semibold text-white mb-3">
          Most Engaged Subscribers
        </h2>
        {loading ? (
          <Skeleton className="h-40 w-full rounded-[20px]" />
        ) : top ? (
          <SubscriberCard subscriber={top} variant="hero" rank={1} />
        ) : (
          <div className="surface-card p-5 text-sm text-white/55">
            No subscribers yet — your top fan will show up here.
          </div>
        )}
      </section>

      {/* Top Users */}
      <section>
        <div className="flex items-center justify-between mb-1 gap-3">
          <h2 className="text-[15px] font-semibold text-white shrink-0">Top Users</h2>
          <SortDropdown value={sort} onChange={setSort} />
        </div>
        <p className="text-xs text-white/55 leading-relaxed mb-4">
          Discover and connect with the top users who are most engaged with your content,
          and see who&apos;s supporting you the most.
        </p>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-[20px]" />
            ))}
          </div>
        ) : rest.length === 0 ? (
          <p className="text-xs text-white/40">Nothing to show yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {rest.map((s) => (
              <SubscriberCard key={s.id} subscriber={s} />
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: TopSubscribersSort;
  onChange: (v: TopSubscribersSort) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs font-medium text-[#FD23A7] hover:opacity-90 transition-opacity"
      >
        {current.label}
        <ChevronDown
          className={cn(
            "size-3.5 text-[#FD23A7] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="animate-fade-in absolute top-full right-0 mt-2 z-30 min-w-[180px] surface-elev rounded-[12px] p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
        >
          {SORT_OPTIONS.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onChange(o.value);
                  close();
                }}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2 transition-colors",
                  active
                    ? "bg-white/[0.06] text-white font-medium"
                    : "text-white/75 hover:bg-white/[0.04] hover:text-white"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    active ? "bg-gradient-brand" : "bg-transparent"
                  )}
                />
                {o.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
