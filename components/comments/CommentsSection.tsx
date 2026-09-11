"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";
import { comments as commentsApi } from "@/services/modules/comments";
import { ApiError } from "@/services/apiClient";
import { useAuth } from "@/services/context";
import type { CommentOut, CreatorMini, MeOut } from "@/services/dtos";
import { cn, timeAgo } from "@/lib/utils";

/**
 * Normalize a comment payload — the backend may return `author`, `user`,
 * `commenter`, or flat `authorUsername`/`authorAvatarUrl` fields. If the
 * caller has a fresh `MeOut` (e.g. the just-posted comment is by us),
 * pass it as `me` so we can hydrate a missing/partial author without
 * waiting for a full profile lookup.
 */
function normalizeComment(raw: unknown, me?: MeOut | null): CommentOut {
  const c = raw as Record<string, unknown> & Partial<CommentOut>;

  // Prefer whichever field the backend actually sent.
  const nested =
    (c.author as CreatorMini | undefined) ||
    ((c as { user?: CreatorMini }).user) ||
    ((c as { commenter?: CreatorMini }).commenter);

  let author: CreatorMini | undefined = nested && nested.username ? nested : undefined;

  // Fall back to flat "author*" fields on the root object.
  if (!author) {
    const flat = c as {
      authorId?: string;
      authorUsername?: string;
      authorDisplayName?: string | null;
      authorAvatarUrl?: string | null;
      authorVerified?: boolean;
    };
    if (flat.authorUsername) {
      author = {
        id: flat.authorId ?? flat.authorUsername,
        username: flat.authorUsername,
        displayName: flat.authorDisplayName ?? null,
        avatarUrl: flat.authorAvatarUrl ?? null,
        verified: flat.authorVerified ?? false,
      };
    }
  }

  // Last resort: hydrate with the current user (only makes sense for
  // just-posted comments where we know the author is `me`).
  if (!author && me) {
    author = {
      id: me.id,
      username: me.username,
      displayName: me.displayName,
      avatarUrl: me.avatarUrl,
      verified: me.verified,
    };
  }

  return {
    ...(c as CommentOut),
    author: author as CreatorMini,
  };
}

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";
const PAGE_SIZE = 20;
const MAX_LEN = 500;

type Props = {
  postId: string;
  allowComments: boolean;
  authorUsername: string;
  onCountChange?: (delta: number) => void;
  className?: string;
};

/**
 * Inline comments list + composer for a single post. Renders empty state,
 * loading skeletons, load-more, and optimistic add/delete. Only fetches
 * on mount — the caller controls visibility (toggle open/close).
 */
export function CommentsSection({
  postId,
  allowComments,
  authorUsername,
  onCountChange,
  className,
}: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<CommentOut[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const page = await commentsApi.list(postId, { limit: PAGE_SIZE });
        if (cancelled) return;
        setItems(page.items.map((c) => normalizeComment(c)));
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load comments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    try {
      const page = await commentsApi.list(postId, {
        cursor,
        limit: PAGE_SIZE,
      });
      setItems((prev) =>
        dedupe([...prev, ...page.items.map((c) => normalizeComment(c))])
      );
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load more");
    } finally {
      setLoadingMore(false);
    }
  }, [postId, cursor, hasMore, loadingMore]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = body.trim();
      if (!trimmed || posting) return;
      setPosting(true);
      try {
        const created = await commentsApi.add(postId, trimmed);
        // Backend may or may not echo the author — hydrate with `me` so
        // our own just-posted comment always renders correctly.
        setItems((prev) => [normalizeComment(created, user), ...prev]);
        onCountChange?.(1);
        setBody("");
      } catch (e) {
        const msg =
          e instanceof ApiError
            ? e.code === "rate_limited"
              ? "You're commenting too fast — try again in a moment."
              : e.code === "comments_disabled"
              ? "Comments are turned off for this post."
              : e.detail ?? e.message
            : "Couldn't post comment";
        toast.error(msg);
      } finally {
        setPosting(false);
      }
    },
    [body, postId, posting, onCountChange, user]
  );

  const remove = useCallback(
    async (id: string) => {
      const prev = items;
      setItems((cur) => cur.filter((c) => c.id !== id));
      onCountChange?.(-1);
      try {
        await commentsApi.delete(id);
      } catch (e) {
        setItems(prev);
        onCountChange?.(1);
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't delete comment");
      }
    },
    [items, onCountChange]
  );

  return (
    <section
      aria-label="Comments"
      className={cn("border-t border-white/[0.05]", className)}
    >
      {allowComments ? (
        <form className="flex items-start gap-3 px-4 py-3" onSubmit={submit}>
          <Avatar
            name={user?.displayName || user?.username || "You"}
            gradient={BRAND_GRADIENT}
            image={user?.avatarUrl ?? undefined}
            size={32}
          />
          <div className="flex-1 min-w-0 flex items-start gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
              placeholder={user ? "Write a comment…" : "Log in to comment"}
              disabled={!user || posting}
              rows={1}
              className="flex-1 min-w-0 resize-none rounded-[14px] bg-white/[0.04] hairline text-[14px] text-white placeholder:text-white/40 px-3.5 py-2 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Post comment"
              disabled={!user || posting || body.trim().length === 0}
              className="inline-flex items-center justify-center size-9 rounded-full bg-gradient-brand text-white on-media disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition-opacity shrink-0"
            >
              {posting ? (
                <span
                  aria-hidden
                  className="size-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                />
              ) : (
                <Send className="size-4" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="px-4 py-3 text-xs text-white/50">
          Comments are turned off for this post.
        </div>
      )}

      <ul className="flex flex-col">
        {loading ? (
          <CommentSkeletonList />
        ) : items.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-white/50">
            {allowComments ? "Be the first to comment." : "No comments yet."}
          </li>
        ) : (
          items.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              canDelete={
                !!user &&
                (user.username === c.author?.username ||
                  user.username === authorUsername)
              }
              onDelete={() => remove(c.id)}
            />
          ))
        )}
      </ul>

      {hasMore && !loading && items.length > 0 ? (
        <div className="flex justify-center py-3">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="text-xs font-medium text-white/70 hover:text-white disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more comments"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function CommentRow({
  comment,
  canDelete,
  onDelete,
}: {
  comment: CommentOut;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const author = comment.author;
  const username = author?.username;
  const name = author?.displayName || username || "Deleted user";
  const profileHref = username ? `/creator/${username}` : null;

  const avatar = (
    <Avatar
      name={name}
      gradient={BRAND_GRADIENT}
      image={author?.avatarUrl ?? undefined}
      size={32}
    />
  );

  return (
    <li className="flex items-start gap-3 px-4 py-3 group">
      {profileHref ? (
        <Link href={profileHref} className="shrink-0">
          {avatar}
        </Link>
      ) : (
        <span className="shrink-0">{avatar}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {profileHref ? (
            <Link
              href={profileHref}
              className="text-[13px] font-semibold text-white truncate hover:underline underline-offset-2"
            >
              {name}
            </Link>
          ) : (
            <span className="text-[13px] font-semibold text-white truncate">
              {name}
            </span>
          )}
          {author ? <VerifiedBadge active={author.verified} /> : null}
          <span className="text-white/40 text-xs">·</span>
          <span className="text-[11px] text-white/45 shrink-0">
            {timeAgo(comment.createdAt)}
          </span>
        </div>
        <p className="text-[14px] text-white/85 whitespace-pre-wrap break-words mt-0.5">
          {comment.body}
        </p>
      </div>
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete comment"
          title="Delete"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity inline-flex items-center justify-center size-7 rounded-full text-white/50 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </li>
  );
}

function CommentSkeletonList() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-3">
          <SkeletonCircle size={32} />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-32 rounded-full" />
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-3 w-2/3 rounded-full" />
          </div>
        </li>
      ))}
    </>
  );
}

function dedupe(list: CommentOut[]): CommentOut[] {
  const seen = new Set<string>();
  const out: CommentOut[] = [];
  for (const c of list) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}
