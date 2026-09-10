"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  ExternalLink,
  ImagePlus,
  MoreHorizontal,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { posts as postsApi, type MinePostsStatus } from "@/services/modules/posts";
import { ApiError } from "@/services/apiClient";
import type { PostOut, PostStatus } from "@/services/dtos";
import { cn, formatCompact, formatNaira, timeAgo } from "@/lib/utils";

type TabValue = "all" | "drafts" | "scheduled" | "published";
const PAGE_SIZE = 20;

const STATUS_QUERY: Record<TabValue, MinePostsStatus> = {
  all: "all",
  drafts: "drafts",
  scheduled: "scheduled",
  published: "published",
};

export default function PostsPage() {
  const [tab, setTab] = useState<TabValue>("all");
  const [items, setItems] = useState<PostOut[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchPage = useCallback(
    (nextCursor?: string | null) =>
      postsApi.mine({
        status: STATUS_QUERY[tab],
        cursor: nextCursor ?? undefined,
        limit: PAGE_SIZE,
      }),
    [tab]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setItems([]);
      setCursor(null);
      setHasMore(true);
      setInitialLoaded(false);
      setLoading(true);
      try {
        const page = await fetchPage(null);
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load posts");
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
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const page = await fetchPage(cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load more");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, fetchPage]);

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

  const removeLocal = (id: string) =>
    setItems((prev) => prev.filter((p) => p.id !== id));
  const replaceLocal = (updated: PostOut) =>
    setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const tabs = useMemo(
    () => [
      { value: "all", label: "All" },
      { value: "published", label: "Published" },
      { value: "drafts", label: "Drafts" },
      { value: "scheduled", label: "Scheduled" },
    ],
    []
  );

  return (
    <DashboardShell
      title="Posts"
      subtitle="Manage your content, drafts, and scheduled posts."
      action={
        <Button href="/dashboard/posts/new" leftIcon={<Plus />}>
          New post
        </Button>
      }
    >
      <div className="flex items-center gap-4 mb-4">
        <Tabs
          items={tabs}
          value={tab}
          onValueChange={(v) => setTab(v as TabValue)}
        />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.6fr_140px_100px_100px_120px_140px_40px] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-white/45 border-b border-white/[0.05]">
          <div>Post</div>
          <div>Visibility</div>
          <div className="text-right">Views</div>
          <div className="text-right">Likes</div>
          <div>Status</div>
          <div>Date</div>
          <div />
        </div>

        {items.length === 0 && !initialLoaded && loading ? (
          <ul>
            {Array.from({ length: 5 }).map((_, i) => (
              <PostRowSkeleton key={i} />
            ))}
          </ul>
        ) : items.length === 0 && initialLoaded && !loading ? (
          <div className="p-14 text-center flex flex-col items-center gap-3">
            <div className="size-12 rounded-full bg-white/[0.05] hairline flex items-center justify-center">
              <ImagePlus className="size-5 text-white/70" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              {tab === "drafts"
                ? "No drafts yet"
                : tab === "scheduled"
                ? "Nothing scheduled"
                : tab === "published"
                ? "No published posts yet"
                : "You haven't posted yet"}
            </h3>
            <p className="text-sm text-white/55 max-w-sm">
              Publish your first post to start earning.
            </p>
            <Button href="/dashboard/posts/new" leftIcon={<Plus />} size="sm" className="mt-1">
              New post
            </Button>
          </div>
        ) : (
          <ul>
            {items.map((p) => (
              <PostRow
                key={p.id}
                post={p}
                onDeleted={removeLocal}
                onUpdated={replaceLocal}
              />
            ))}
          </ul>
        )}
      </div>

      {loading && items.length > 0 ? (
        <div className="py-6 flex items-center justify-center">
          <span
            aria-hidden
            className="size-6 rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
          />
        </div>
      ) : null}

      <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
    </DashboardShell>
  );
}

/* ── Row ─────────────────────────────────────────────── */

function PostRow({
  post,
  onDeleted,
  onUpdated,
}: {
  post: PostOut;
  onDeleted: (id: string) => void;
  onUpdated: (post: PostOut) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState<null | "publish" | "delete">(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const firstMedia = post.media[0];

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const publish = async () => {
    if (busy) return;
    setBusy("publish");
    try {
      const updated = await postsApi.publish(post.id);
      onUpdated(updated);
      toast.success("Post published");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't publish");
    } finally {
      setBusy(null);
      setMenuOpen(false);
    }
  };

  const del = async () => {
    if (busy) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this post? This is permanent.")
    )
      return;
    setBusy("delete");
    try {
      await postsApi.delete(post.id);
      onDeleted(post.id);
      toast.success("Post deleted");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't delete");
    } finally {
      setBusy(null);
      setMenuOpen(false);
    }
  };

  const dateLabel =
    post.status === "scheduled" && post.scheduledFor
      ? `Scheduled for ${new Date(post.scheduledFor).toLocaleDateString()}`
      : post.publishedAt
      ? `${timeAgo(post.publishedAt)} ago`
      : `${timeAgo(post.createdAt)} ago`;

  return (
    <li className="grid grid-cols-1 md:grid-cols-[1.6fr_140px_100px_100px_120px_140px_40px] gap-4 px-5 py-4 border-t border-white/[0.05] items-center">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-12 rounded-[10px] shrink-0 bg-black overflow-hidden bg-cover bg-center hairline"
          style={{
            backgroundImage: firstMedia?.playbackUrl
              ? `url(${firstMedia.playbackUrl})`
              : firstMedia?.posterUrl
              ? `url(${firstMedia.posterUrl})`
              : "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)",
          }}
        />
        <div className="min-w-0">
          <div className="text-sm text-white/90 line-clamp-1">
            {post.caption ?? <span className="italic text-white/45">No caption</span>}
          </div>
          <div className="text-[11px] text-white/45 md:hidden mt-0.5">{dateLabel}</div>
        </div>
      </div>

      <div>
        {post.visibility === "ppv" ? (
          <Badge variant="warning">
            PPV · {formatNaira(Math.round((post.ppvPriceKobo ?? 0) / 100), { compact: true })}
          </Badge>
        ) : post.visibility === "subscribers" ? (
          <Badge variant="brand">Subscribers</Badge>
        ) : (
          <Badge variant="muted">Free</Badge>
        )}
      </div>
      <div className="text-sm text-white/80 md:text-right">
        {formatCompact(post.viewCount)}
      </div>
      <div className="text-sm text-white/80 md:text-right">
        {formatCompact(post.likeCount)}
      </div>
      <div>
        <StatusBadge status={post.status} />
      </div>
      <div className="text-sm text-white/60 hidden md:block">{dateLabel}</div>

      <div ref={wrapRef} className="justify-self-end relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Post actions"
          className="inline-flex items-center justify-center size-8 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06]"
        >
          <MoreHorizontal className="size-4" />
        </button>
        {menuOpen ? (
          <div
            role="menu"
            className="animate-fade-in absolute top-full right-0 mt-2 z-20 min-w-[180px] surface-elev rounded-[12px] p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
          >
            {post.status === "published" ? (
              <RowMenuLink href={`/creator/${post.creator.username}`} icon={<ExternalLink className="size-4" />}>
                View
              </RowMenuLink>
            ) : null}
            {post.status === "draft" || post.status === "scheduled" ? (
              <RowMenuButton
                onClick={publish}
                icon={busy === "publish" ? <MiniSpinner /> : <Send className="size-4" />}
              >
                {busy === "publish" ? "Publishing…" : "Publish now"}
              </RowMenuButton>
            ) : null}
            <RowMenuButton
              onClick={del}
              danger
              icon={busy === "delete" ? <MiniSpinner /> : <Trash2 className="size-4" />}
            >
              {busy === "delete" ? "Deleting…" : "Delete"}
            </RowMenuButton>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  if (status === "published")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-green-300">
        <Check className="size-3" /> Published
      </span>
    );
  if (status === "scheduled")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
        <Calendar className="size-3" /> Scheduled
      </span>
    );
  if (status === "draft")
    return <span className="text-[11px] text-white/55">Draft</span>;
  if (status === "archived")
    return <span className="text-[11px] text-white/45">Archived</span>;
  return <span className="text-[11px] text-red-300/70">{status}</span>;
}

function RowMenuButton({
  children,
  icon,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2.5 transition-colors",
        danger
          ? "text-red-300 hover:bg-red-500/10 hover:text-red-200"
          : "text-white/85 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function RowMenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] flex items-center gap-2.5 transition-colors text-white/85 hover:bg-white/[0.06] hover:text-white"
    >
      {icon}
      {children}
    </Link>
  );
}

function MiniSpinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-3.5 rounded-full border-2 border-white/25 border-t-white/85 animate-spin"
    />
  );
}

function PostRowSkeleton() {
  return (
    <li
      className="grid grid-cols-1 md:grid-cols-[1.6fr_140px_100px_100px_120px_140px_40px] gap-4 px-5 py-4 border-t border-white/[0.05] items-center"
      aria-busy
    >
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton className="size-11 rounded-[10px] shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <Skeleton className="h-3.5 w-3/4 rounded-full" />
          <Skeleton className="h-3 w-1/3 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-3.5 w-16 rounded-full ml-auto md:ml-0" />
      <Skeleton className="h-3.5 w-10 rounded-full ml-auto" />
      <Skeleton className="h-3.5 w-10 rounded-full ml-auto" />
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-3.5 w-20 rounded-full" />
      <Skeleton className="size-6 rounded-full" />
    </li>
  );
}
