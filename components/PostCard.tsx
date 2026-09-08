import Link from "next/link";
import {
  Bookmark,
  Heart,
  Lock,
  MessageCircle,
  Play,
  Share2,
  Volume2,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PostMenu } from "@/components/PostMenu";
import type { Creator, Post } from "@/lib/mock-data";
import { cn, formatCompact, formatNaira, timeAgo } from "@/lib/utils";

type Props = {
  post: Post;
  creator: Creator;
  showHeader?: boolean;
};

export function PostCard({ post, creator, showHeader = true }: Props) {
  return (
    <article className="surface-card overflow-hidden">
      {showHeader ? (
        <header className="flex items-center gap-3 p-4">
          <Link href={`/creator/${creator.username}`}>
            <Avatar name={creator.name} gradient={creator.avatarGradient} size={40} />
          </Link>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                href={`/creator/${creator.username}`}
                className="text-sm font-semibold text-white truncate hover:underline underline-offset-2"
              >
                {creator.name}
              </Link>
              {creator.verified ? <VerifiedBadge /> : null}
              <span className="text-white/40">·</span>
              <span className="text-xs text-white/50 shrink-0">{timeAgo(post.timestamp)}</span>
            </div>
            <span className="text-xs text-white/45 truncate">@{creator.username}</span>
          </div>
          <PostMenu authorUsername={creator.username} />
        </header>
      ) : null}

      <div className="px-4 pb-3">
        <p className="text-[15px] leading-relaxed text-white/85 whitespace-pre-wrap">
          {post.caption}
        </p>
      </div>

      <PostMedia post={post} creator={creator} />

      <footer className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1 text-white/70">
          <IconButton>
            <Heart className="size-[18px]" />
            <span className="text-xs font-medium">{formatCompact(post.likes)}</span>
          </IconButton>
          <IconButton>
            <MessageCircle className="size-[18px]" />
            <span className="text-xs font-medium">{formatCompact(post.comments)}</span>
          </IconButton>
          <IconButton>
            <Share2 className="size-[18px]" />
          </IconButton>
        </div>
        <IconButton>
          <Bookmark className="size-[18px]" />
        </IconButton>
      </footer>
    </article>
  );
}

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
      {children}
    </button>
  );
}

function PostMedia({ post, creator }: { post: Post; creator: Creator }) {
  return (
    <div className="relative mx-4 mb-1 aspect-[4/5] sm:aspect-[16/10] rounded-[14px] overflow-hidden hairline">
      <div className="absolute inset-0" style={{ backgroundImage: post.mediaGradient }} />
      <div
        className="absolute inset-0 mix-blend-overlay opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(600px 200px at 20% 10%, rgba(255,255,255,0.4), transparent 60%)",
        }}
      />

      {post.mediaKind === "video" ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-14 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20">
            <Play className="size-6 text-white translate-x-[1px]" fill="currentColor" />
          </div>
        </div>
      ) : null}
      {post.mediaKind === "audio" ? (
        <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-full glass px-4 py-2.5">
          <div className="size-9 rounded-full bg-gradient-brand flex items-center justify-center shrink-0">
            <Volume2 className="size-4 text-white" />
          </div>
          <div className="h-1.5 flex-1 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full w-1/3 bg-white/80" />
          </div>
          <span className="text-xs text-white/70 shrink-0">2:14</span>
        </div>
      ) : null}

      {post.locked ? <LockedOverlay post={post} creator={creator} /> : null}
    </div>
  );
}

function LockedOverlay({ post, creator }: { post: Post; creator: Creator }) {
  const isPpv = typeof post.ppvPrice === "number";
  return (
    <div className={cn("on-media absolute inset-0 backdrop-blur-2xl bg-black/40 flex flex-col items-center justify-center gap-3 p-6 text-center")}>
      <div className="size-12 rounded-full bg-gradient-brand flex items-center justify-center shadow-[0_10px_40px_-8px_rgba(105,41,252,0.6)]">
        <Lock className="size-5 text-white" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-white font-semibold text-[15px]">
          {isPpv ? "Unlock this post" : "Subscribe to unlock"}
        </span>
        <span className="text-white/60 text-xs">
          {isPpv
            ? "Pay-per-view content available for a one-time price"
            : "Only active subscribers can view this content"}
        </span>
      </div>
      <Button href={`/creator/${creator.username}`} size="sm" className="mt-1">
        {isPpv
          ? `Unlock for ${formatNaira(post.ppvPrice!)}`
          : `Subscribe for ${formatNaira(creator.monthlyPrice)}/month`}
      </Button>
    </div>
  );
}
