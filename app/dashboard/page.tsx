"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Plus } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { PostCard, PostFeedSkeleton } from "@/components/PostCard";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { CreatorRail } from "@/components/creator/CreatorRail";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { StoryTray } from "@/components/stories/StoryTray";
import { StoryCreator } from "@/components/stories/StoryCreator";
import { feed } from "@/services/modules/feed";
import { useStoriesFeed, useMyStories } from "@/services/hooks/stories";
import { ApiError } from "@/services/apiClient";
import { useAuth } from "@/services/context";
import type { Page, PostOut } from "@/services/dtos";

type Tab = "following" | "for-you";
const TABS: { value: Tab; label: string }[] = [
  { value: "for-you", label: "For You" },
  { value: "following", label: "Following" },
];
const PAGE_SIZE = 12;
const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

type TabCache = {
  items: PostOut[];
  cursor: string | null;
  hasMore: boolean;
  loaded: boolean;
};

const emptyCache = (): TabCache => ({
  items: [],
  cursor: null,
  hasMore: true,
  loaded: false,
});

function fetchByTab(tab: Tab, cursor?: string | null): Promise<Page<PostOut>> {
  const params = { cursor: cursor ?? undefined, limit: PAGE_SIZE };
  return tab === "following" ? feed.following(params) : feed.forYou(params);
}

export default function DashboardHomePage() {
  const { user } = useAuth();
  const storiesFeed = useStoriesFeed(!!user);
  const isCreator = user?.role === "creator";
  const myStories = useMyStories(isCreator ? user?.username ?? null : null);
  const [storyCreatorOpen, setStoryCreatorOpen] = useState(false);

  const [tab, setTab] = useState<Tab>("for-you");
  const [cache, setCache] = useState<Record<Tab, TabCache>>({
    "for-you": emptyCache(),
    following: emptyCache(),
  });
  const [loading, setLoading] = useState(false);

  const current = cache[tab];

  const patchTab = useCallback(
    (t: Tab, patch: Partial<TabCache>) =>
      setCache((c) => ({ ...c, [t]: { ...c[t], ...patch } })),
    []
  );

  useEffect(() => {
    if (current.loaded) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const page = await fetchByTab(tab, null);
        if (cancelled) return;
        patchTab(tab, {
          items: page.items,
          cursor: page.nextCursor,
          hasMore: page.nextCursor !== null,
          loaded: true,
        });
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load feed");
        patchTab(tab, { loaded: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, current.loaded, patchTab]);

  const loadMore = useCallback(async () => {
    if (loading || !current.hasMore || !current.loaded) return;
    setLoading(true);
    try {
      const page = await fetchByTab(tab, current.cursor);
      patchTab(tab, {
        items: [...current.items, ...page.items],
        cursor: page.nextCursor,
        hasMore: page.nextCursor !== null,
      });
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load more");
    } finally {
      setLoading(false);
    }
  }, [loading, current.hasMore, current.loaded, current.cursor, current.items, tab, patchTab]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  const removePost = (id: string) =>
    setCache((c) => ({
      ...c,
      [tab]: { ...c[tab], items: c[tab].items.filter((p) => p.id !== id) },
    }));
  const replacePost = (updated: PostOut) =>
    setCache((c) => ({
      ...c,
      [tab]: {
        ...c[tab],
        items: c[tab].items.map((p) => (p.id === updated.id ? updated : p)),
      },
    }));

  return (
    <DashboardShell variant="creator">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_450px]">
        <div className="flex flex-col gap-4 min-w-0">
          {/* Stories tray — always show for creators (so they can post),
              otherwise render only when the viewer has stories to see. */}
          {isCreator || storiesFeed.items.length > 0 || storiesFeed.loading ? (
            <StoryTray
              items={storiesFeed.items}
              loading={storiesFeed.loading}
              onStoriesChange={() => {
                storiesFeed.refresh();
                myStories.refresh();
              }}
              onCreate={isCreator ? () => setStoryCreatorOpen(true) : undefined}
              me={
                isCreator && user
                  ? {
                      username: user.username,
                      displayName: user.displayName,
                      avatarUrl: user.avatarUrl,
                    }
                  : undefined
              }
              ownStories={myStories.items}
            />
          ) : null}

          <ComposerCta />

          <FeedTabs
            items={TABS}
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
            className="mt-1"
          />

          <div className="flex flex-col gap-4">
            {current.items.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                onChange={replacePost}
                onRemove={removePost}
              />
            ))}

            {loading && current.items.length === 0 ? (
              <PostFeedSkeleton count={3} />
            ) : loading ? (
              <div className="py-8 flex items-center justify-center">
                <span
                  aria-hidden
                  className="size-6 rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
                />
              </div>
            ) : null}

            {!loading && current.loaded && current.items.length === 0 ? (
              <EmptyState
                title={
                  tab === "following"
                    ? "Follow creators to fill this feed"
                    : "Nothing to show yet"
                }
                body="Publish a post or explore new creators to get started."
              />
            ) : null}

            {!current.hasMore && current.items.length > 0 ? (
              <div className="py-6 text-center text-xs text-white/40">
                You&apos;re all caught up.
              </div>
            ) : null}

            <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
          </div>
        </div>

        <CreatorRail />
      </div>

      {storyCreatorOpen ? (
        <StoryCreator
          open
          onClose={() => setStoryCreatorOpen(false)}
          onCreated={() => {
            storiesFeed.refresh();
            myStories.refresh();
          }}
        />
      ) : null}
    </DashboardShell>
  );
}

/* Small "start a post" CTA — links to /dashboard/posts/new for the full form */
function ComposerCta() {
  const { user } = useAuth();
  const displayName = user?.displayName || user?.username || "you";
  return (
    <Link
      href="/dashboard/posts/new"
      className="surface-card p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
    >
      <Avatar
        name={displayName}
        gradient={BRAND_GRADIENT}
        image={user?.avatarUrl ?? undefined}
        size={40}
      />
      <span className="flex-1 text-sm text-white/55">Start a post…</span>
      <span className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium text-white/85 bg-white/[0.06] hairline">
        <ImagePlus className="size-3.5" /> Media
      </span>
      <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold bg-gradient-brand text-white on-media">
        <Plus className="size-3.5" /> New post
      </span>
    </Link>
  );
}
