"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { PostCard, PostFeedSkeleton } from "@/components/PostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { posts as postsApi } from "@/services/modules/posts";
import { ApiError } from "@/services/apiClient";
import type { PostOut } from "@/services/dtos";

const PAGE_SIZE = 12;

export default function BookmarksPage() {
  const [items, setItems] = useState<PostOut[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const page = await postsApi.bookmarks({
        cursor: cursor ?? undefined,
        limit: PAGE_SIZE,
      });
      setItems((prev) => dedupe([...prev, ...page.items]));
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load bookmarks");
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [loading, hasMore, cursor]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const page = await postsApi.bookmarks({ limit: PAGE_SIZE });
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load bookmarks");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitialLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handlePostChange = (updated: PostOut) => {
    if (!updated.bookmarked) {
      setItems((prev) => prev.filter((p) => p.id !== updated.id));
    } else {
      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    }
  };

  const removePost = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  return (
    <DashboardShell
      title="Bookmarks"
      subtitle="Posts you've saved from the community."
    >
      {items.length === 0 && !initialLoaded && loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <PostFeedSkeleton count={2} />
          <PostFeedSkeleton count={2} />
        </div>
      ) : items.length === 0 && initialLoaded && !loading ? (
        <EmptyState
          title="No bookmarks yet"
          body="Tap the bookmark icon on any post to save it here for later."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onChange={handlePostChange}
              onRemove={removePost}
            />
          ))}
        </div>
      )}

      {loading && items.length > 0 ? (
        <div className="py-8 flex items-center justify-center">
          <span
            aria-hidden
            className="size-6 rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
          />
        </div>
      ) : null}

      {!hasMore && items.length > 0 ? (
        <div className="py-6 text-center text-xs text-white/40">
          That&apos;s everything you&apos;ve saved.
        </div>
      ) : null}

      <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
    </DashboardShell>
  );
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
