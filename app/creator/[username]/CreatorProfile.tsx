"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  DollarSign,
  ExternalLink,
  Globe,
  Heart,
  Link as LinkIcon,
  MessageCircle,
  Search,
  Share2,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PostCard } from "@/components/PostCard";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { SubscriptionPanel } from "@/components/creator/SubscriptionPanel";
import { FeedTabs } from "@/components/feed/FeedTabs";
import Link from "next/link";
import { creators as allCreators, type Creator, type Post } from "@/lib/mock-data";
import { cn, formatCompact, formatNaira } from "@/lib/utils";
import { useAuth } from "@/services/context";
import { useFollow, useUserProfile } from "@/services/hooks/users";
import { ApiError } from "@/services/apiClient";

export function CreatorProfile({ creator, posts }: { creator: Creator; posts: Post[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("posts");
  const [subOpen, setSubOpen] = useState(false);

  const { user } = useAuth();
  const isSelf = user?.username === creator.username;

  const profile = useUserProfile(isSelf ? null : creator.username);
  const followState = useFollow(
    creator.username,
    profile.data?.isFollowing ?? undefined
  );
  const following = followState.following;

  const handleFollowClick = async () => {
    if (isSelf) return;
    try {
      await followState.toggle();
    } catch (e) {
      if (e instanceof ApiError) {
        const map: Record<string, string> = {
          user_not_found: "Creator not found",
          self_follow: "You can't follow yourself",
          blocked: "This user is unavailable.",
        };
        toast.error(map[e.code] ?? e.detail ?? e.message);
      }
    }
  };

  const tabs = [
    { value: "posts", label: "Posts" },
    { value: "media", label: "Media" },
  ];

  const media = posts.filter((p) => p.mediaKind !== "audio");

  return (
    <>
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-6 lg:-mb-8 -mb-24 flex min-h-[calc(100dvh-56px)]">
        {/* ─── Main column (cover + header + content) ─── */}
        <div className="flex-1 min-w-0 flex flex-col pb-24 lg:pb-8">
        {/* Cover with back button overlay */}
        <div className="relative h-48 sm:h-64 overflow-hidden bg-neutral-900">
          {creator.image ? (
            <Image
              src={creator.image}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 1152px"
              className="object-cover object-top scale-110"
              priority
            />
          ) : (
            <div className="absolute inset-0" style={{ backgroundImage: creator.coverGradient }} />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(7,7,10,0.35) 45%, rgba(7,7,10,0.9) 100%)",
            }}
          />

          {/* Back button */}
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="on-media absolute top-4 left-4 inline-flex items-center justify-center size-10 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/55 transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
        </div>

        {/* Header */}
        <div className="px-4 sm:px-8 -mt-14 sm:-mt-16 relative flex flex-col gap-4">
          {/* Row: Avatar (left) + Actions (right, same line) */}
          <div className="flex items-end justify-between gap-4">
            <Avatar
              name={creator.name}
              gradient={creator.avatarGradient}
              image={creator.image}
              size={112}
              ring
              className="ring-4 ring-[#07070A] shrink-0"
            />

            {/* Actions — single straight line, right-aligned */}
            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mt-4 sm:mt-6">
              {!isSelf ? (
                <button
                  onClick={handleFollowClick}
                  aria-pressed={following}
                  disabled={followState.loading}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold transition-colors shrink-0 disabled:opacity-70",
                    following
                      ? "bg-white/[0.06] hairline text-white hover:bg-white/[0.1]"
                      : "bg-gradient-brand text-white on-media shadow-[0_10px_30px_-12px_rgba(253,35,167,0.55)] hover:opacity-95"
                  )}
                >
                  <Heart
                    className="size-4"
                    fill={following ? "currentColor" : "none"}
                    strokeWidth={2}
                  />
                  {following ? "Following" : "Follow"}
                </button>
              ) : null}
              <IconAction label="Message">
                <MessageCircle className="size-4" />
              </IconAction>
              <IconAction label="Send a tip">
                <DollarSign className="size-4" />
              </IconAction>
              <IconAction label="Share">
                <Share2 className="size-4" />
              </IconAction>
              <span className="hidden sm:inline-block w-px h-6 bg-white/[0.08] mx-1 shrink-0" />
              {creator.socials?.instagram ? (
                <SocialButton href="#" label="Instagram">
                  <Globe className="size-4" />
                </SocialButton>
              ) : null}
              {creator.socials?.twitter ? (
                <SocialButton href="#" label="X / Twitter">
                  <ExternalLink className="size-4" />
                </SocialButton>
              ) : null}
              <SocialButton href="#" label="Website">
                <LinkIcon className="size-4" />
              </SocialButton>
            </div>
          </div>

          {/* Info block */}
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {creator.name}
              </h1>
              {creator.verified ? <VerifiedBadge className="!size-5" /> : null}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-white/55">
              <span className="text-white/70">@{creator.username}</span>
              <span className="text-white/30">·</span>
              <span>last seen 3 hours ago</span>
            </div>
            <p className="text-white/80 leading-relaxed max-w-2xl mt-1">{creator.bio}</p>
            <div className="flex items-center gap-1.5 text-sm text-white/60 mt-1">
              <Users className="size-4" />
              <span className="font-medium text-white">
                {formatCompact(creator.subscribers)}
              </span>
              subscribers
              <span className="text-white/30 mx-1">·</span>
              <span>{formatNaira(creator.monthlyPrice)}/mo</span>
            </div>
          </div>
        </div>

        {/* Body — main column content only */}
        <div className="px-4 sm:px-8 mt-8 flex flex-col gap-8">
          {/* Subscribe Now + Bundles */}
          <SubscriptionPanel creator={creator} onSubscribe={() => setSubOpen(true)} />

          <FeedTabs items={tabs} value={tab} onValueChange={setTab} />

          {tab === "posts" ? (
            <div className="flex flex-col gap-4">
              {posts.length === 0 ? (
                <EmptyPosts />
              ) : (
                posts.map((p) => <PostCard key={p.id} post={p} creator={creator} />)
              )}
            </div>
          ) : null}

          {tab === "media" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {media.map((p) => (
                <div
                  key={p.id}
                  className="relative aspect-square rounded-[12px] overflow-hidden"
                >
                  <div
                    className="absolute inset-0"
                    style={{ backgroundImage: p.mediaGradient }}
                  />
                  {p.locked ? (
                    <div className="on-media absolute inset-0 backdrop-blur-xl bg-black/40 flex items-center justify-center">
                      <span className="text-xs text-white/80 bg-black/40 rounded-full px-3 py-1">
                        🔒 Locked
                      </span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        </div>

        {/* ─── Right sidebar — full-height, sticky, bleeds to edge ─── */}
        <aside className="hidden lg:flex flex-col shrink-0 w-80 sticky top-0 h-[100dvh] border-l border-white/[0.06] px-5 py-6 gap-6 overflow-y-auto bg-app">
          {/* Search Posts */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
            <input
              placeholder="Search Posts"
              className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-sm text-white placeholder:text-white/40 pl-10 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
            />
          </div>

          {/* About */}
          <section>
            <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-white/60 mb-3">
              About
            </h3>
            <div className="surface-card p-4 flex flex-col gap-3">
              <p className="text-[13px] text-white/80 leading-relaxed">{creator.bio}</p>
              <div className="divider" />
              <dl className="flex flex-col gap-2 text-[12px]">
                <MetaRow label="Joined" value="Sep 2024" />
                <MetaRow label="Last active" value="3h ago" />
                <MetaRow
                  label="Verified"
                  value={creator.verified ? "Yes" : "No"}
                />
                <MetaRow
                  label="Subscribers"
                  value={formatCompact(creator.subscribers)}
                />
              </dl>
            </div>
          </section>

          {/* Similar creators */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-white/60">
                Similar creators
              </h3>
              <Link
                href="/explore"
                className="text-[11px] text-[#FD23A7] hover:opacity-80 font-medium"
              >
                See all
              </Link>
            </div>
            <ul className="flex flex-col gap-2">
              {allCreators
                .filter((c) => c.username !== creator.username)
                .sort((a, b) => b.subscribers - a.subscribers)
                .slice(0, 3)
                .map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/creator/${c.username}`}
                      className="flex items-center gap-3 p-2 rounded-[12px] hover:bg-white/[0.04] transition-colors"
                    >
                      <Avatar
                        name={c.name}
                        gradient={c.avatarGradient}
                        image={c.image}
                        size={40}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-[13px] font-semibold text-white truncate">
                            {c.name}
                          </span>
                          {c.verified ? <VerifiedBadge className="!size-3" /> : null}
                        </div>
                        <div className="text-[11px] text-white/55 truncate">
                          @{c.username} · {formatCompact(c.subscribers)} subs
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#FD23A7] uppercase tracking-wider shrink-0">
                        {formatNaira(c.monthlyPrice, { compact: true })}/mo
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>

          {/* Recent tips (top spenders) */}
          <section>
            <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-white/60 mb-3">
              Recent supporters
            </h3>
            <div className="flex items-center -space-x-2">
              {allCreators.slice(0, 6).map((c) => (
                <span
                  key={c.id}
                  className="size-8 rounded-full ring-2 ring-[#0E0E14] overflow-hidden"
                  style={{ backgroundImage: c.avatarGradient }}
                  title={c.name}
                />
              ))}
            </div>
            <p className="text-[11px] text-white/55 mt-2">
              <span className="font-semibold text-white">
                {formatCompact(creator.subscribers)}
              </span>{" "}
              people support {creator.name.split(" ")[0]}.
            </p>
          </section>
        </aside>
      </div>

      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} creator={creator} />
    </>
  );
}

function SocialButton({
  href,
  children,
  label,
}: {
  href: string;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center size-10 rounded-full bg-white/[0.05] hairline text-white/70 hover:text-white hover:bg-white/[0.08] shrink-0"
    >
      {children}
    </a>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-white/55">{label}</dt>
      <dd className="text-white font-medium">{value}</dd>
    </div>
  );
}

function IconAction({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center size-10 rounded-full bg-white/[0.06] hairline text-white/85 hover:bg-white/[0.1] hover:text-white transition-colors shrink-0"
    >
      {children}
    </button>
  );
}

function EmptyPosts() {
  return (
    <div className="surface-card p-10 text-center">
      <p className="text-white/60">No posts yet. Come back soon.</p>
    </div>
  );
}
