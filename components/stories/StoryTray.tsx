"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";
import { StoryPlayer } from "./StoryPlayer";
import type { StoryFeedGroupOut, StoryOut } from "@/services/dtos";
import { cn } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

export type StoryTrayMe = {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

type Props = {
  items: StoryFeedGroupOut[];
  loading?: boolean;
  onStoriesChange?: () => void;
  className?: string;
  /** When provided, render a "+ Your story" tile at the start. */
  onCreate?: () => void;
  /** Required alongside `onCreate` — used for the avatar on the create tile. */
  me?: StoryTrayMe | null;
  /** Current user's own active stories — tapping "Your story" plays them. */
  ownStories?: StoryOut[];
};

export function StoryTray({
  items,
  loading,
  onStoriesChange,
  className,
  onCreate,
  me,
  ownStories = [],
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const canCreate = !!onCreate && !!me;
  const hasOwnStories = ownStories.length > 0;

  // Compose a groups array for the player: if we have own stories, they're
  // group [0]; then everything else from the feed. Own stories always show
  // as "viewed" for the owner (backend excludes owner's own view state).
  const playerGroups = useMemo<StoryFeedGroupOut[]>(() => {
    if (!hasOwnStories || !me) return items;
    const own: StoryFeedGroupOut = {
      creator: ownStories[0].creator,
      stories: ownStories,
      hasUnviewed: false,
    };
    return [own, ...items];
  }, [hasOwnStories, me, ownStories, items]);

  // The offset "Your story" occupies when own stories exist (for openIndex
  // → playerGroups index mapping).
  const feedOffset = hasOwnStories ? 1 : 0;

  if (loading && items.length === 0 && !canCreate) {
    return (
      <section className={cn("w-full", className)} aria-label="Stories">
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
              <SkeletonCircle size={64} />
              <Skeleton className="h-2.5 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0 && !canCreate) return null;

  return (
    <>
      <section className={cn("w-full", className)} aria-label="Stories">
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {canCreate ? (
            <div className="flex flex-col items-center gap-1.5 shrink-0 w-16">
              <div className="relative size-16">
                <button
                  type="button"
                  onClick={() => (hasOwnStories ? setOpenIndex(0) : onCreate?.())}
                  aria-label={
                    hasOwnStories ? "View your story" : "Create a new story"
                  }
                  className={cn(
                    "grid place-items-center size-16 rounded-full transition-colors",
                    hasOwnStories
                      ? "bg-gradient-brand"
                      : "bg-white/[0.12] hover:bg-white/[0.18]"
                  )}
                >
                  <span className="grid place-items-center size-[58px] rounded-full bg-[var(--bg)]">
                    <Avatar
                      name={me?.displayName || me?.username || "You"}
                      gradient={BRAND_GRADIENT}
                      image={me?.avatarUrl ?? undefined}
                      size={54}
                    />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onCreate}
                  aria-label="Add to your story"
                  className="absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center size-[22px] rounded-full bg-gradient-brand ring-[3px] ring-[var(--bg)] hover:scale-110 transition-transform"
                >
                  <Plus className="size-3 text-white" strokeWidth={3} />
                </button>
              </div>
              <span className="text-[11px] text-white/85 truncate max-w-full leading-tight">
                Your story
              </span>
            </div>
          ) : null}

          {items.map((group, i) => {
            const c = group.creator;
            const name = c.displayName || c.username;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setOpenIndex(i + feedOffset)}
                aria-label={`View ${name}'s stories`}
                className="flex flex-col items-center gap-1.5 shrink-0 w-16 group"
              >
                <span
                  className={cn(
                    "grid place-items-center size-16 rounded-full",
                    group.hasUnviewed
                      ? "bg-gradient-brand"
                      : "bg-white/[0.12]"
                  )}
                >
                  <span className="grid place-items-center size-[58px] rounded-full bg-[var(--bg)]">
                    <Avatar
                      name={name}
                      gradient={BRAND_GRADIENT}
                      image={c.avatarUrl ?? undefined}
                      size={54}
                    />
                  </span>
                </span>
                <span className="text-[11px] text-white/85 truncate max-w-full leading-tight">
                  {c.displayName || `@${c.username}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {openIndex !== null ? (
        <StoryPlayer
          groups={playerGroups}
          initialGroupIndex={openIndex}
          onClose={() => {
            setOpenIndex(null);
            onStoriesChange?.();
          }}
        />
      ) : null}
    </>
  );
}
