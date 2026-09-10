"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { PostCard, PostFeedSkeleton } from "@/components/PostCard";
import { FeedRightRail } from "@/components/feed/FeedRightRail";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { FeaturedCreators } from "@/components/featured/FeaturedCreators";
import { StoryTray } from "@/components/stories/StoryTray";
import { EmptyState as FeedEmpty } from "@/components/ui/EmptyState";
import { feed } from "@/services/modules/feed";
import { useStoriesFeed } from "@/services/hooks/stories";
import { useAuth } from "@/services/context";
import { ApiError } from "@/services/apiClient";
import type { Page, PostOut } from "@/services/dtos";

type Tab = "following" | "for-you" | "explore";

const TABS: { value: Tab; label: string }[] = [
  { value: "for-you", label: "For You" },
  { value: "following", label: "Following" },
  { value: "explore", label: "Explore" },
];

const PAGE_SIZE = 12;

type TabCache = {
  items: PostOut[];
  cursor: string | null;
  hasMore: boolean;
  loaded: boolean;
  error: ApiError | null;
};

const emptyCache = (): TabCache => ({
  items: [],
  cursor: null,
  hasMore: true,
  loaded: false,
  error: null,
});

function fetchByTab(tab: Tab, cursor?: string | null): Promise<Page<PostOut>> {
  const params = { cursor: cursor ?? undefined, limit: PAGE_SIZE };
  if (tab === "following") return feed.following(params);
  if (tab === "for-you") return feed.forYou(params);
  return feed.explore({ ...params, sort: "newest" });
}

export default function FeedPage() {
  const { user } = useAuth();
  const storiesFeed = useStoriesFeed(!!user);
  const hasStories = storiesFeed.items.length > 0;

  const [tab, setTab] = useState<Tab>("for-you");
  const [cache, setCache] = useState<Record<Tab, TabCache>>({
    "for-you": emptyCache(),
    following: emptyCache(),
    explore: emptyCache(),
  });
  const [loading, setLoading] = useState(false);

  const current = cache[tab];

  const patchTab = useCallback(
    (t: Tab, patch: Partial<TabCache>) => {
      setCache((c) => ({ ...c, [t]: { ...c[t], ...patch } }));
    },
    []
  );

  // First-load per tab (only when the cache for that tab hasn't been filled yet).
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
          error: null,
        });
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError)
          patchTab(tab, { loaded: true, error: e });
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
        items: dedupe([...current.items, ...page.items]),
        cursor: page.nextCursor,
        hasMore: page.nextCursor !== null,
      });
    } catch (e) {
      if (e instanceof ApiError)
        toast.error(e.detail ?? "Couldn't load more posts");
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
    <DashboardShell variant="fan">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_450px]">
        <div className="flex flex-col min-w-0">
          {/* Mobile: stories tray if any, otherwise featured creators */}
          <div className="lg:hidden mb-5">
            {hasStories || storiesFeed.loading ? (
              <StoryTray
                items={storiesFeed.items}
                loading={storiesFeed.loading}
                onStoriesChange={storiesFeed.refresh}
              />
            ) : (
              <FeaturedCreators />
            )}
          </div>

          {/* Desktop: stories tray above the tabs when items exist OR while
              first-loading (so it doesn't pop in after auth settles). */}
          {hasStories || (storiesFeed.loading && !storiesFeed.loaded) ? (
            <div className="hidden lg:block mb-5">
              <StoryTray
                items={storiesFeed.items}
                loading={storiesFeed.loading}
                onStoriesChange={storiesFeed.refresh}
              />
            </div>
          ) : null}

          <FeedTabs
            items={TABS}
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
            className="mb-4"
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

            {!loading && current.loaded && current.items.length === 0 && !current.error ? (
              <EmptyState tab={tab} />
            ) : null}

            {current.error && current.items.length === 0 ? (
              <div className="surface-card p-8 text-center text-red-300 text-sm">
                {current.error.detail ?? "Couldn't load the feed."}
              </div>
            ) : null}

            {!current.hasMore && current.items.length > 0 ? (
              <div className="py-6 text-center text-xs text-white/40">
                You&apos;re all caught up.
              </div>
            ) : null}

            <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
          </div>
        </div>

        <FeedRightRail />
      </div>
    </DashboardShell>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const copy = useMemo(() => {
    switch (tab) {
      case "following":
        return {
          title: "Follow creators to fill this feed",
          body: "When you follow or subscribe, their posts show up here.",
        };
      case "for-you":
        return {
          title: "Nothing to show yet",
          body: "Follow a few creators and we'll start recommending.",
        };
      case "explore":
        return {
          title: "Explore is empty right now",
          body: "Check back soon — new creators are joining every day.",
        };
    }
  }, [tab]);
  return <FeedEmpty title={copy.title} body={copy.body} />;
}

function dedupe(list: PostOut[]): PostOut[] {
  const seen = new Set<string>();
  const out: PostOut[] = [];
  for (const p of list) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out;
}
