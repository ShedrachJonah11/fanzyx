"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Bookmark,
  Check,
  DollarSign,
  Heart,
  Lock,
  MessageCircle,
  Share2,
  Volume2,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonCircle, SkeletonText } from "@/components/ui/Skeleton";
import { PostMenu } from "@/components/PostMenu";
import { TipModal } from "@/components/tip/TipModal";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { posts as postsApi } from "@/services/modules/posts";
import { ApiError } from "@/services/apiClient";
import { useAuth } from "@/services/context";
import { newIdempotencyKey } from "@/lib/idempotency";
import type { MediaOut, PostOut } from "@/services/dtos";
import { cn, formatCompact, formatNaira, timeAgo } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

type Props = {
  post: PostOut;
  showHeader?: boolean;
  onChange?: (updated: PostOut) => void;
  onRemove?: (id: string) => void;
};

export function PostCard({ post: initial, showHeader = true, onChange, onRemove }: Props) {
  const { user } = useAuth();
  const [post, setPost] = useState<PostOut>(initial);
  const [likeBusy, setLikeBusy] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const isSelf = user?.username === post.creator.username;

  const update = (patch: Partial<PostOut>) => {
    const next = { ...post, ...patch };
    setPost(next);
    onChange?.(next);
  };

  const replace = (next: PostOut) => {
    setPost(next);
    onChange?.(next);
  };

  const toggleLike = async () => {
    if (likeBusy) return;
    const prev = { liked: post.liked, likeCount: post.likeCount };
    const nextLiked = !post.liked;
    update({
      liked: nextLiked,
      likeCount: post.likeCount + (nextLiked ? 1 : -1),
    });
    setLikeBusy(true);
    try {
      if (nextLiked) await postsApi.like(post.id);
      else await postsApi.unlike(post.id);
    } catch (e) {
      update(prev);
      if (e instanceof ApiError) toast.error(e.detail ?? e.message);
    } finally {
      setLikeBusy(false);
    }
  };

  const toggleBookmark = async () => {
    if (bookmarkBusy) return;
    const prev = { bookmarked: post.bookmarked };
    update({ bookmarked: !post.bookmarked });
    setBookmarkBusy(true);
    try {
      if (!post.bookmarked) await postsApi.bookmark(post.id);
      else await postsApi.unbookmark(post.id);
    } catch (e) {
      update(prev);
      if (e instanceof ApiError) toast.error(e.detail ?? e.message);
    } finally {
      setBookmarkBusy(false);
    }
  };

  const share = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/post/${post.id}`
        : "";
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ url, title: `${post.creator.displayName ?? post.creator.username} on FanzyX` });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const timestamp = post.publishedAt ?? post.createdAt;
  const displayName = post.creator.displayName || post.creator.username;

  return (
    <article className="surface-card-brand overflow-hidden">
      {showHeader ? (
        <header className="flex items-center gap-3 px-4 pt-4">
          <span className="inline-flex items-center justify-center size-10 rounded-full bg-white/[0.04] hairline shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/fanzyx-brand-assets/mark/svg/fanzyx-mark-gradient.svg"
              alt=""
              className="size-6"
            />
          </span>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[15px] font-semibold text-white truncate">
                FanzyX
              </span>
              <VerifiedBadge />
              <span className="text-white/40">·</span>
              <span className="text-xs text-white/50 shrink-0">
                {timeAgo(timestamp)}
              </span>
            </div>
            <span className="text-xs text-white/45 truncate">@fanzyx</span>
          </div>
          <PostMenu
            postId={post.id}
            authorUsername={post.creator.username}
            onDeleted={() => onRemove?.(post.id)}
          />
        </header>
      ) : null}

      {post.caption ? (
        <div className="px-4 pt-3">
          <p className="text-[15px] leading-relaxed text-white/85 whitespace-pre-wrap">
            {post.caption}
          </p>
        </div>
      ) : null}

      {/* Creator promo strip — avatar + creator + SUBSCRIBE NOW pill on brand gradient */}
      {showHeader ? (
        <div className="px-4 pt-3">
          <div className="on-media relative flex items-center gap-3 rounded-[14px] overflow-hidden p-2.5 pr-3 group isolate bg-gradient-brand">
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(600px 200px at 20% 20%, rgba(255,255,255,0.4), transparent 60%)",
              }}
            />
            {/* Flash sweep — diagonal shine that travels across the strip */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/4 w-1/3 animate-shine [animation-duration:5s] bg-gradient-to-r from-transparent via-white/45 to-transparent z-[5]"
            />
            <Link
              href={`/creator/${post.creator.username}`}
              className="flex items-center gap-3 flex-1 min-w-0 relative z-10 -m-1 p-1 rounded-[10px] hover:opacity-95"
            >
              <Avatar
                name={displayName}
                gradient={BRAND_GRADIENT}
                image={post.creator.avatarUrl ?? undefined}
                size={44}
                ring
                className="ring-2 ring-black/40 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[16px] font-bold text-white truncate drop-shadow">
                    {displayName}
                  </span>
                  {post.creator.verified ? <VerifiedBadge /> : null}
                </div>
                <div className="text-[12px] text-white/85 truncate drop-shadow">
                  @{post.creator.username}
                </div>
              </div>
            </Link>
            {!isSelf ? (
              <button
                type="button"
                onClick={() => setSubOpen(true)}
                className="relative z-10 inline-flex items-center h-9 px-4 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white text-[#FD23A7] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.5)] hover:scale-[1.02] transition-transform shrink-0"
              >
                Subscribe now
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {post.tags && post.tags.length > 0 ? (
        <div className="px-4 pt-3 flex flex-wrap gap-x-3 gap-y-1">
          {post.tags.map((t) => (
            <Link
              key={t}
              href={`/explore?tag=${encodeURIComponent(t)}`}
              className="text-[13px] font-medium text-[#FD23A7] hover:underline underline-offset-2 decoration-[#FD23A7]/70"
            >
              #{t}
            </Link>
          ))}
        </div>
      ) : null}

      {post.poll ? (
        <div className="px-4 pt-3">
          <PollBlock post={post} onVoted={replace} />
        </div>
      ) : null}

      <div className="pt-3">
        <PostMediaBlock post={post} onUnlocked={replace} />
      </div>

      <footer className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1 text-white/70">
          <button
            type="button"
            onClick={toggleLike}
            disabled={likeBusy}
            aria-pressed={post.liked}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors",
              post.liked
                ? "text-[#FD23A7] hover:bg-[#FD23A7]/10"
                : "text-white/70 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <Heart
              className="size-[18px]"
              fill={post.liked ? "currentColor" : "none"}
              strokeWidth={2}
            />
            <span className="text-xs font-medium">
              {formatCompact(Math.max(0, post.likeCount))}
            </span>
          </button>
          <IconButton
            onClick={() => setCommentsOpen((v) => !v)}
            aria-expanded={commentsOpen}
            aria-controls={`comments-${post.id}`}
          >
            <MessageCircle className="size-[18px]" />
            <span className="text-xs font-medium">{formatCompact(post.commentCount)}</span>
          </IconButton>
          <IconButton onClick={share}>
            <Share2 className="size-[18px]" />
          </IconButton>
          {!isSelf ? (
            <button
              type="button"
              onClick={() => setTipOpen(true)}
              aria-label="Send a tip"
              title="Send a tip"
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[#FD5CC9] hover:text-white hover:bg-[#FD23A7]/10 transition-colors"
            >
              <DollarSign className="size-[18px]" />
              <span className="text-xs font-medium">Send tip</span>
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={toggleBookmark}
          disabled={bookmarkBusy}
          aria-pressed={post.bookmarked}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full p-1.5 transition-colors",
            post.bookmarked
              ? "text-white hover:bg-white/[0.06]"
              : "text-white/70 hover:text-white hover:bg-white/[0.06]"
          )}
        >
          <Bookmark
            className="size-[18px]"
            fill={post.bookmarked ? "currentColor" : "none"}
            strokeWidth={2}
          />
        </button>
      </footer>

      {commentsOpen ? (
        <div id={`comments-${post.id}`}>
          <CommentsSection
            postId={post.id}
            allowComments={post.allowComments}
            authorUsername={post.creator.username}
            onCountChange={(delta) =>
              update({ commentCount: Math.max(0, post.commentCount + delta) })
            }
          />
        </div>
      ) : null}

      {tipOpen ? (
        <TipModal
          target={{
            username: post.creator.username,
            displayName: post.creator.displayName,
            avatarUrl: post.creator.avatarUrl,
            postId: post.id,
          }}
          onClose={() => setTipOpen(false)}
        />
      ) : null}

      <SubscriptionModal
        open={subOpen}
        onClose={() => setSubOpen(false)}
        target={{
          username: post.creator.username,
          displayName: post.creator.displayName,
          avatarUrl: post.creator.avatarUrl,
          verified: post.creator.verified,
        }}
      />
    </article>
  );
}

function IconButton({
  children,
  onClick,
  "aria-expanded": ariaExpanded,
  "aria-controls": ariaControls,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
    >
      {children}
    </button>
  );
}

function PostMediaBlock({
  post,
  onUnlocked,
}: {
  post: PostOut;
  onUnlocked: (next: PostOut) => void;
}) {
  const first = post.media[0];
  const hasMedia = !!first;
  const extraCount = Math.max(0, post.media.length - 1);

  // Locked posts have no media dimensions.
  if (post.locked) {
    const isPpv = post.unlock?.kind === "ppv";
    if (isPpv) {
      return (
        <div className="relative mx-4 mb-1 aspect-[4/5] sm:aspect-[16/10] rounded-[14px] overflow-hidden hairline bg-black">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: BRAND_GRADIENT, opacity: 0.5 }}
          />
          <LockedOverlay post={post} onUnlocked={onUnlocked} />
        </div>
      );
    }
    return <SubscribeGate post={post} />;
  }

  if (!hasMedia) {
    // Placeholder for text-only posts stays as a small strip.
    return null;
  }

  return (
    <div className="relative mx-4 mb-1 rounded-[14px] overflow-hidden hairline bg-black">
      <MediaRenderer media={first} />
      {extraCount > 0 ? (
        <span className="absolute top-3 right-3 z-10 rounded-full bg-black/60 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-white">
          +{extraCount}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Renders a single media item at its natural aspect ratio. Images use
 * object-contain with a cap on height so nothing dominates the feed. Videos
 * and audio keep a fixed slot.
 */
function MediaRenderer({ media }: { media: MediaOut }) {
  if (media.kind === "video") {
    const aspect =
      media.width && media.height
        ? `${media.width}/${media.height}`
        : "16/10";
    if (media.playbackUrl) {
      return (
        <VideoPlayer
          src={media.playbackUrl}
          poster={media.posterUrl}
          aspectRatio={aspect}
          className="w-full max-h-[720px] bg-black"
        />
      );
    }
    // No playbackUrl — most commonly the backend is still transcoding.
    const failed = media.status === "failed";
    return (
      <div
        className="relative w-full flex items-center justify-center bg-black text-white/70"
        style={{ aspectRatio: aspect, maxHeight: 720 }}
      >
        {media.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.posterUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: BRAND_GRADIENT, opacity: 0.35 }} />
        )}
        <div className="relative flex flex-col items-center gap-2">
          {failed ? (
            <span className="text-sm text-red-200">Video failed to process</span>
          ) : (
            <>
              <span
                aria-hidden
                className="size-6 rounded-full border-2 border-white/25 border-t-white/85 animate-spin"
              />
              <span className="text-xs text-white/70">Processing video…</span>
            </>
          )}
        </div>
      </div>
    );
  }

  if (media.kind === "audio") {
    return (
      <div className="w-full aspect-[16/6] flex items-center justify-center bg-gradient-brand-soft">
        {media.playbackUrl ? (
          <audio controls src={media.playbackUrl} className="w-4/5 max-w-md" />
        ) : (
          <div className="size-14 rounded-full bg-gradient-brand flex items-center justify-center">
            <Volume2 className="size-6 text-white" />
          </div>
        )}
      </div>
    );
  }

  const src = media.playbackUrl ?? media.posterUrl;

  // Placeholder when a media item is present but the CDN URL hasn't been
  // populated yet (mock data, or backend still processing). Renders a soft
  // brand gradient at the media's natural aspect so the card doesn't collapse.
  if (!src) {
    return (
      <div
        className="w-full bg-gradient-brand-soft"
        style={{
          aspectRatio:
            media.width && media.height
              ? `${media.width} / ${media.height}`
              : "4 / 5",
          maxHeight: 720,
        }}
      />
    );
  }

  // Image — show the full frame, no crop. Height flexes with the image's
  // natural aspect; letterboxed against black if the image is taller than
  // the cap. Uses width/height when known for zero layout shift.
  if (media.width && media.height) {
    return (
      <Image
        src={src}
        alt=""
        width={media.width}
        height={media.height}
        sizes="(max-width: 640px) 100vw, 640px"
        className="w-full h-auto max-h-[720px] object-contain bg-black"
      />
    );
  }

  return (
    <div
      className="relative w-full bg-black"
      style={{ aspectRatio: "4 / 5", maxHeight: 720 }}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, 640px"
        className="object-contain"
      />
    </div>
  );
}

function SubscribeGate({ post }: { post: PostOut }) {
  return (
    <div className="mx-4 mb-1 rounded-[14px] overflow-hidden hairline bg-white/[0.03] flex flex-col">
      <div className="flex-1 flex items-center justify-center py-14 px-6 min-h-[240px]">
        <div className="size-24 rounded-full bg-white/[0.06] flex items-center justify-center">
          <Lock
            className="size-8 text-white/50"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
      </div>
      <div className="p-3">
        <Link
          href={`/creator/${post.creator.username}#plans`}
          className="w-full inline-flex items-center justify-center rounded-full py-3 bg-gradient-brand text-white on-media font-bold uppercase tracking-wide text-[13px] hover:opacity-95 transition-opacity"
        >
          Subscribe to see full content
        </Link>
      </div>
    </div>
  );
}

function LockedOverlay({
  post,
  onUnlocked,
}: {
  post: PostOut;
  onUnlocked: (next: PostOut) => void;
}) {
  const [busy, setBusy] = useState(false);
  const unlock = post.unlock;
  const isPpv = unlock?.kind === "ppv";

  const price = unlock?.priceKobo ?? post.ppvPriceKobo ?? 0;

  const doUnlock = async () => {
    if (!isPpv || busy) return;
    setBusy(true);
    try {
      const next = await postsApi.unlock(post.id, newIdempotencyKey());
      onUnlocked(next);
      toast.success("Unlocked");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "insufficient_funds") {
          toast.error("Not enough in your wallet. Top up to unlock.");
        } else if (e.code === "self_unlock") {
          toast.error("You can't unlock your own post.");
        } else {
          toast.error(e.detail ?? e.message);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="on-media absolute inset-0 backdrop-blur-2xl bg-black/50 flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="size-12 rounded-full bg-gradient-brand flex items-center justify-center shadow-[0_10px_40px_-8px_rgba(105,41,252,0.6)]">
        <Lock className="size-5 text-white" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-white font-semibold text-[15px]">
          {isPpv ? "Unlock this post" : "Subscribe to unlock"}
        </span>
        <span className="text-white/60 text-xs">
          {isPpv
            ? "One-time payment from your wallet"
            : "Only active subscribers can view this content"}
        </span>
      </div>
      {isPpv ? (
        <Button size="sm" className="mt-1" onClick={doUnlock} disabled={busy}>
          {busy
            ? "Unlocking…"
            : `Unlock for ${formatNaira(Math.round(price / 100))}`}
        </Button>
      ) : (
        <Button
          size="sm"
          className="mt-1"
          href={`/creator/${post.creator.username}`}
        >
          View subscription plans
        </Button>
      )}
    </div>
  );
}

/* ── Poll ─────────────────────────────────────────────── */

function PollBlock({
  post,
  onVoted,
}: {
  post: PostOut;
  onVoted: (next: PostOut) => void;
}) {
  const poll = post.poll!;
  const { user } = useAuth();
  const [busy, setBusy] = useState<number | null>(null);

  const isOwner = user?.id === post.creator.id;
  const alreadyVoted = poll.userVoteIndex !== null;
  const showResults = alreadyVoted || poll.expired || isOwner;
  const canClick = poll.canVote && !showResults && !busy;
  const total = Math.max(1, poll.totalVotes);

  const vote = async (i: number) => {
    if (!canClick || busy !== null) return;
    setBusy(i);
    try {
      const next = await postsApi.vote(post.id, i);
      onVoted(next);
    } catch (e) {
      if (e instanceof ApiError) {
        const map: Record<string, string> = {
          self_vote: "You can't vote on your own poll.",
          invalid_option: "That option isn't valid.",
          poll_expired: "This poll has ended.",
          already_voted: "You already voted.",
          post_locked: "Subscribe or unlock to vote.",
          no_poll: "This poll no longer exists.",
        };
        toast.error(map[e.code] ?? e.detail ?? e.message);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-[14px] hairline bg-white/[0.02] p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-3.5 text-white/50" />
        <span className="text-xs uppercase tracking-wider text-white/50">Poll</span>
        {poll.expired ? (
          <span className="text-[11px] text-white/45">· ended</span>
        ) : poll.expiresAt ? (
          <span className="text-[11px] text-white/45">
            · ends {new Date(poll.expiresAt).toLocaleDateString()}
          </span>
        ) : null}
      </div>

      <p className="text-[15px] font-medium text-white/90 leading-snug">
        {poll.question}
      </p>

      <ul className="flex flex-col gap-2">
        {poll.options.map((opt, i) => {
          const count = poll.votes[i] ?? 0;
          const pct = showResults ? Math.round((count / total) * 100) : 0;
          const picked = poll.userVoteIndex === i;

          if (showResults) {
            return (
              <li
                key={i}
                className={cn(
                  "relative rounded-[10px] hairline overflow-hidden bg-white/[0.03]",
                  picked && "ring-1 ring-[#FD23A7]/40"
                )}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-brand-soft"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative px-3 py-2.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    {picked ? (
                      <Check className="size-3.5 text-[#FD5CC9] shrink-0" />
                    ) : null}
                    <span className="text-white/90 truncate">{opt}</span>
                  </span>
                  <span className="text-white/75 shrink-0 ml-3 font-medium">
                    {pct}%
                  </span>
                </div>
              </li>
            );
          }

          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => vote(i)}
                disabled={!canClick}
                className={cn(
                  "w-full text-left rounded-[10px] hairline px-3 py-2.5 text-sm text-white/90 transition-colors",
                  canClick
                    ? "bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
                    : "bg-white/[0.03] opacity-70 cursor-not-allowed"
                )}
              >
                {busy === i ? "Voting…" : opt}
              </button>
            </li>
          );
        })}
      </ul>

      <span className="text-[11px] text-white/45">
        {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
        {!poll.canVote && !alreadyVoted && !poll.expired && !isOwner ? (
          <span> · subscribers only</span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * Skeleton placeholder for a feed post while it's loading. Matches the
 * real card's shell + rough layout so the transition doesn't jump.
 * Render N of these in a column to mimic an in-flight feed.
 */
export function PostCardSkeleton({ showMedia = true }: { showMedia?: boolean }) {
  return (
    <article
      className="surface-card-brand overflow-hidden"
      aria-busy
      aria-label="Loading post"
    >
      <header className="flex items-center gap-3 p-4">
        <SkeletonCircle size={40} />
        <div className="flex flex-col flex-1 gap-1.5">
          <Skeleton className="h-3.5 w-40 rounded-full" />
          <Skeleton className="h-3 w-24 rounded-full" />
        </div>
      </header>

      <div className="px-4 pb-3">
        <SkeletonText lines={2} />
      </div>

      {showMedia ? (
        <div className="mx-4 mb-1 rounded-[14px] overflow-hidden hairline">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
        </div>
      ) : null}

      <footer className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <Skeleton className="size-6 rounded-full" />
      </footer>
    </article>
  );
}

/**
 * Convenience: renders a vertical list of PostCardSkeleton. Handy for the
 * initial-load state of the feed / dashboard / bookmarks / saved pages.
 */
export function PostFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} showMedia={i % 2 === 0} />
      ))}
    </div>
  );
}
