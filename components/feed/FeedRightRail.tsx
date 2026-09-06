"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, Camera, ChevronDown, Search, Users } from "lucide-react";
import HeartIcon from "@iconify-react/at-icons/heart";
import VideoCameraIcon from "@iconify-react/at-icons/video-camera";
import ImageOutlineIcon from "@iconify-react/basil/image-outline";
import { FeaturedCreators } from "@/components/featured/FeaturedCreators";
import {
  featuredCreators,
  posts as allPosts,
  type Creator,
} from "@/lib/mock-data";
import { cn, formatCompact } from "@/lib/utils";

type SortMode = "subs" | "newest" | "likes";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "subs", label: "Highest subscribed" },
  { value: "newest", label: "Newest" },
  { value: "likes", label: "Most likes" },
];

type Props = {
  creators: Creator[];
};

export function FeedRightRail({ creators }: Props) {
  const [sort, setSort] = useState<SortMode>("subs");

  const likesByCreator = useMemo(() => {
    return allPosts.reduce((acc, p) => {
      acc[p.creatorUsername] = (acc[p.creatorUsername] || 0) + p.likes;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  const explore = useMemo(() => {
    const arr = [...creators];
    if (sort === "subs") arr.sort((a, b) => b.subscribers - a.subscribers);
    else if (sort === "newest") arr.sort((a, b) => Number(b.id) - Number(a.id));
    else
      arr.sort(
        (a, b) => (likesByCreator[b.username] ?? 0) - (likesByCreator[a.username] ?? 0)
      );
    return arr.slice(0, 6);
  }, [creators, sort, likesByCreator]);

  return (
    <aside className="hidden lg:flex flex-col gap-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1 [scrollbar-width:thin]">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
        <input
          placeholder="Search here…"
          className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-sm text-white placeholder:text-white/40 pl-10 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
        />
      </div>

      {/* Featured Creators */}
      <FeaturedCreators creators={featuredCreators} />

      {/* Explore */}
      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-1 gap-3">
          <h3 className="text-[15px] font-semibold text-white shrink-0">Explore</h3>
          <SortDropdown value={sort} onChange={setSort} />
        </div>
        <p className="text-xs text-white/55 leading-relaxed mb-4">
          Explore the talents and discover captivating premium content from your favourite
          creators.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {explore.map((c) => (
            <ExploreTile key={c.id} creator={c} />
          ))}
        </div>
      </section>
    </aside>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (v: SortMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = SORT_OPTIONS.find((o) => o.value === value) ?? SORT_OPTIONS[0];

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

function ExploreTile({ creator }: { creator: Creator }) {
  const media = mediaCountsFor(creator);
  const likes = totalLikesFor(creator.username);
  return (
    <Link
      href={`/creator/${creator.username}`}
      aria-label={`View ${creator.name}'s profile`}
      className="on-media group relative aspect-[3/4] rounded-[14px] overflow-hidden block bg-neutral-900 transition-transform duration-200 hover:scale-[1.01]"
    >
      {creator.image ? (
        <Image
          src={creator.image}
          alt={creator.name}
          fill
          sizes="(max-width: 1024px) 45vw, 180px"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundImage: creator.coverGradient }} />
      )}

      {/* Bottom gradient */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3/5 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.9) 100%)",
        }}
      />

      {/* Avatar with white ring */}
      <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2">
        <div className="relative size-14 rounded-full overflow-hidden ring-[3px] ring-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          {creator.image ? (
            <Image src={creator.image} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <div
              className="absolute inset-0"
              style={{ backgroundImage: creator.avatarGradient }}
              aria-hidden
            />
          )}
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-2 flex flex-col items-center gap-1">
        <div className="min-w-0 flex flex-col items-center w-full">
          <div className="flex items-center justify-center gap-0.5 min-w-0 max-w-full">
            <h3 className="text-white font-bold text-[13px] truncate leading-tight">
              {creator.name.split(" ")[0]}
            </h3>
            {creator.verified ? (
              <BadgeCheck
                aria-label="Verified"
                className="size-3 text-[#FD23A7] shrink-0"
                fill="currentColor"
                stroke="#0B0B12"
                strokeWidth={2}
              />
            ) : null}
          </div>
          <p className="text-white text-[10px] font-medium truncate mt-0.5 text-center max-w-full">
            @{creator.username}
          </p>
        </div>

        {/* Stats — likes/followers on top, videos/photos underneath */}
        <div className="flex flex-col items-center gap-0.5 mt-0.5 text-white w-full">
          <div className="flex items-center gap-3">
            <StatIcon icon={<HeartIcon height="1em" />} value={formatCompact(likes)} />
            <StatIcon icon={<Users className="size-3" fill="currentColor" strokeWidth={0} />} value={formatCompact(creator.subscribers)} />
          </div>
          <div className="flex items-center gap-3">
            <StatIcon icon={<VideoCameraIcon height="1em" />} value={formatCompact(media.video)} />
            <StatIcon icon={<ImageOutlineIcon height="1em" />} value={formatCompact(media.image)} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatIcon({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold leading-none">
      {icon}
      {value}
    </span>
  );
}

function totalLikesFor(username: string): number {
  return allPosts.reduce(
    (sum, p) => (p.creatorUsername === username ? sum + p.likes : sum),
    0
  );
}

function mediaCountsFor(creator: Creator) {
  // Derive stable, realistic-looking media counts from subs.
  const video = Math.max(3, Math.round(creator.subscribers / 380));
  const image = Math.max(6, Math.round(creator.subscribers / 140));
  return { video, image };
}
// Camera import kept for future variants — currently unused
void Camera;
