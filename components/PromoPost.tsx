import Link from "next/link";
import { Bookmark, Heart, MessageCircle, Play, Share2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { PostMenu } from "@/components/PostMenu";
import type { Creator } from "@/lib/mock-data";
import { formatCompact } from "@/lib/utils";

type Props = {
  author: Creator;
  promoted: Creator;
  caption: string;
  hashtag?: string;
  timestamp?: string;
  likes: number;
  comments: number;
  media?: { gradient: string; kind: "video" | "image" };
};

export function PromoPost({
  author,
  promoted,
  caption,
  hashtag,
  likes,
  comments,
  media,
}: Props) {
  const isPlatform = author.username === "fanzyx";
  return (
    <article className="surface-card overflow-hidden">
      <header className="flex items-center gap-3 p-4">
        <AuthorWrap isPlatform={isPlatform} username={author.username} className="shrink-0">
          <Avatar
            name={author.name}
            gradient={author.avatarGradient}
            image={author.image}
            size={40}
          />
        </AuthorWrap>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <AuthorWrap
              isPlatform={isPlatform}
              username={author.username}
              className={
                "text-sm font-semibold text-white truncate " +
                (isPlatform ? "cursor-default" : "hover:underline underline-offset-2")
              }
            >
              {author.name}
            </AuthorWrap>
            {author.verified ? <VerifiedBadge /> : null}
          </div>
          <span className="text-xs text-white/45 truncate">@{author.username}</span>
        </div>
        <PostMenu />
      </header>

      <div className="px-4 pb-3">
        <p className="text-[15px] leading-relaxed text-white/85 whitespace-pre-wrap">
          {caption}
        </p>
      </div>

      {/* Embedded creator promo banner — always uses FanzyX brand gradient */}
      <div className="mx-4">
        <Link
          href={`/creator/${promoted.username}`}
          className="on-media bg-gradient-brand relative flex items-center gap-3 rounded-[14px] overflow-hidden p-3 pr-2 group isolate"
        >
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(600px 200px at 20% 20%, rgba(255,255,255,0.35), transparent 60%)",
            }}
          />

          {/* Flashy left-to-right shine */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/4 w-1/3 animate-shine bg-gradient-to-r from-transparent via-white/45 to-transparent z-10"
          />

          <Avatar
            name={promoted.name}
            gradient={promoted.avatarGradient}
            image={promoted.image}
            size={44}
            ring
            className="ring-2 ring-black/40 relative z-20"
          />
          <div className="flex-1 min-w-0 relative z-20">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[15px] font-semibold text-white truncate drop-shadow">
                {promoted.name}
              </span>
              {promoted.verified ? <VerifiedBadge /> : null}
            </div>
            <div className="text-[11px] text-white/85 truncate drop-shadow">
              @{promoted.username}
            </div>
          </div>
          <span className="relative z-20 rounded-full bg-white text-black text-[11px] font-semibold uppercase tracking-wider px-4 py-2 shadow-[0_6px_20px_-4px_rgba(0,0,0,0.5)] group-hover:opacity-95 transition-opacity">
            Subscribe now
          </span>
        </Link>
      </div>

      {hashtag ? (
        <div className="px-4 pt-3">
          <Link
            href={`/creator/${promoted.username}`}
            className="text-sm text-[#FD23A7] hover:underline underline-offset-2 font-medium"
          >
            #{hashtag}
          </Link>
        </div>
      ) : null}

      {media ? (
        <div className="relative mx-4 mt-3 mb-1 aspect-[4/5] sm:aspect-[16/10] rounded-[14px] overflow-hidden hairline">
          <div className="absolute inset-0" style={{ backgroundImage: media.gradient }} />
          <div
            className="absolute inset-0 mix-blend-overlay opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(600px 200px at 20% 10%, rgba(255,255,255,0.4), transparent 60%)",
            }}
          />
          {media.kind === "video" ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-14 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center ring-1 ring-white/20">
                <Play className="size-6 text-white translate-x-[1px]" fill="currentColor" />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <footer className="flex items-center justify-between px-4 py-3 mt-1">
        <div className="flex items-center gap-1 text-white/70">
          <IconButton>
            <Heart className="size-[18px]" />
            <span className="text-xs font-medium">{formatCompact(likes)}</span>
          </IconButton>
          <IconButton>
            <MessageCircle className="size-[18px]" />
            <span className="text-xs font-medium">{formatCompact(comments)}</span>
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

function AuthorWrap({
  isPlatform,
  username,
  className,
  children,
}: {
  isPlatform: boolean;
  username: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (isPlatform) {
    return <span className={className}>{children}</span>;
  }
  return (
    <Link href={`/creator/${username}`} className={className}>
      {children}
    </Link>
  );
}
