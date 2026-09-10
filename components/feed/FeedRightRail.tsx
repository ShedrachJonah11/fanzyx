"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, ChevronDown, Search, Users } from "lucide-react";
import HeartIcon from "@iconify-react/at-icons/heart";
import VideoCameraIcon from "@iconify-react/at-icons/video-camera";
import ImageOutlineIcon from "@iconify-react/basil/image-outline";
import { FeaturedCreators } from "@/components/featured/FeaturedCreators";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  discover,
  type DiscoverExploreSort,
} from "@/services/modules/discover";
import { ApiError } from "@/services/apiClient";
import type { ExploreCreatorOut } from "@/services/dtos";
import { cn, formatCompact } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";
const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: DiscoverExploreSort; label: string }[] = [
  { value: "subs", label: "Highest subscribed" },
  { value: "newest", label: "Newest" },
  { value: "likes", label: "Most likes" },
];

export function FeedRightRail() {
  const [sort, setSort] = useState<DiscoverExploreSort>("subs");
  const [items, setItems] = useState<ExploreCreatorOut[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Reset when sort changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      setItems([]);
      setCursor(null);
      setHasMore(true);
      setInitialLoaded(false);
      try {
        const page = await discover.explore({ sort, limit: PAGE_SIZE });
        if (cancelled) return;
        setItems(dedupe(page.items));
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
        setInitialLoaded(true);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load creators");
        setInitialLoaded(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sort]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);
    try {
      const page = await discover.explore({ sort, cursor, limit: PAGE_SIZE });
      setItems((prev) => dedupe([...prev, ...page.items]));
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load more");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, sort]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "300px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <aside className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
        <input
          placeholder="Search here…"
          className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-sm text-white placeholder:text-white/40 pl-10 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
        />
      </div>

      <FeaturedCreators />

      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-1 gap-3">
          <h3 className="text-[15px] font-semibold text-white shrink-0">Explore</h3>
          <SortDropdown value={sort} onChange={setSort} />
        </div>
        <p className="text-xs text-white/55 leading-relaxed mb-4">
          Explore the talents and discover captivating premium content from your favourite
          creators.
        </p>

        {loading && items.length === 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-[14px]" />
            ))}
          </div>
        ) : items.length === 0 && initialLoaded ? (
          <p className="text-xs text-white/40">
            Nothing here yet — check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((c) => (
              <ExploreTile key={c.id} creator={c} />
            ))}
          </div>
        )}

        {hasMore && items.length > 0 ? (
          <div ref={sentinelRef} aria-hidden className="h-1 w-full mt-3" />
        ) : null}
        {loading && items.length > 0 ? (
          <div className="flex justify-center pt-3">
            <span
              aria-hidden
              className="size-4 rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
            />
          </div>
        ) : null}
      </section>
    </aside>
  );
}

function ExploreTile({ creator }: { creator: ExploreCreatorOut }) {
  const name = creator.displayName || creator.username;
  const cover = creator.coverUrl;
  const avatar = creator.avatarUrl;
  const hasMediaCounts =
    typeof creator.videoCount === "number" || typeof creator.photoCount === "number";

  return (
    <Link
      href={`/creator/${creator.username}`}
      aria-label={`View ${name}'s profile`}
      className="on-media group relative aspect-[3/4] rounded-[14px] overflow-hidden block bg-neutral-900 transition-transform duration-200 hover:scale-[1.01]"
    >
      {/* Background — real cover if set, otherwise brand gradient. Avatar is
          never blown up as the background (it's already shown in the ring
          below). */}
      {cover ? (
        <Image
          src={cover}
          alt=""
          fill
          sizes="(max-width: 1024px) 45vw, 200px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundImage: BRAND_GRADIENT }} />
      )}

      {/* Bottom gradient — taller so the whole info block reads clearly */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/4 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 30%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      {/* Info stack: avatar → name → handle → stats, all bottom-aligned */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 flex flex-col items-center gap-1.5">
        <div className="relative size-16 rounded-full overflow-hidden ring-[3px] ring-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          {avatar ? (
            <Image src={avatar} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <div
              className="absolute inset-0"
              style={{ backgroundImage: BRAND_GRADIENT }}
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0 flex flex-col items-center w-full">
          <div className="flex items-center justify-center gap-1 min-w-0 max-w-full">
            <h3 className="text-white font-bold text-[15px] truncate leading-tight">
              {name.split(" ")[0]}
            </h3>
            {creator.verified ? (
              <BadgeCheck
                aria-label="Verified"
                className="size-3.5 text-[#FD23A7] shrink-0"
                fill="currentColor"
                stroke="#0B0B12"
                strokeWidth={2}
              />
            ) : null}
          </div>
          <p className="text-white/85 text-[11px] font-medium truncate text-center max-w-full">
            @{creator.username}
          </p>
        </div>

        {/* Stats — subs & followers on row 1; videos & photos on row 2 when available */}
        <div className="flex flex-col items-center gap-0.5 text-white w-full">
          <div className="flex items-center gap-3.5">
            <StatIcon
              icon={<Users className="size-3.5" fill="currentColor" strokeWidth={0} />}
              value={formatCompact(creator.subscriberCount)}
            />
            <StatIcon
              icon={<HeartIcon height="14" width="14" />}
              value={formatCompact(creator.followerCount)}
            />
          </div>
          {hasMediaCounts ? (
            <div className="flex items-center gap-3.5">
              <StatIcon
                icon={<VideoCameraIcon height="14" width="14" />}
                value={formatCompact(creator.videoCount ?? 0)}
              />
              <StatIcon
                icon={<ImageOutlineIcon height="14" width="14" />}
                value={formatCompact(creator.photoCount ?? 0)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function StatIcon({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold leading-none">
      {icon}
      {value}
    </span>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: DiscoverExploreSort;
  onChange: (v: DiscoverExploreSort) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = useMemo(
    () => SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0],
    [value]
  );

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
                  setOpen(false);
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

function dedupe(list: ExploreCreatorOut[]): ExploreCreatorOut[] {
  const seen = new Set<string>();
  const out: ExploreCreatorOut[] = [];
  for (const c of list) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}
