"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Globe,
  Heart,
  Link as LinkIcon,
  MessageCircle,
  Share2,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { PostCard } from "@/components/PostCard";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { SubscriptionPanel } from "@/components/creator/SubscriptionPanel";
import type { Creator, Post } from "@/lib/mock-data";
import { cn, formatCompact, formatNaira } from "@/lib/utils";

export function CreatorProfile({ creator, posts }: { creator: Creator; posts: Post[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("posts");
  const [subOpen, setSubOpen] = useState(false);
  const [following, setFollowing] = useState(false);

  const tabs = [
    { value: "posts", label: "Posts", count: posts.length },
    { value: "media", label: "Media" },
  ];

  const media = posts.filter((p) => p.mediaKind !== "audio");

  return (
    <>
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-6 pb-24">
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
        <div className="px-4 sm:px-8 -mt-14 sm:-mt-16 relative flex flex-col sm:flex-row sm:items-end gap-4">
          <Avatar
            name={creator.name}
            gradient={creator.avatarGradient}
            image={creator.image}
            size={112}
            ring
            className="ring-4 ring-[#07070A]"
          />
          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                  {creator.name}
                </h1>
                {creator.verified ? <VerifiedBadge className="!size-5" /> : null}
                <Badge variant="brand">{creator.category}</Badge>
              </div>
              <span className="text-white/50 text-sm">@{creator.username}</span>
              <p className="text-white/75 mt-2 max-w-2xl">{creator.bio}</p>
              <div className="flex items-center gap-5 mt-2 text-sm text-white/60">
                <div className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  <span className="font-medium text-white">
                    {formatCompact(creator.subscribers)}
                  </span>
                  subscribers
                </div>
                <div className="hidden sm:flex items-center gap-2">
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
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setFollowing((v) => !v)}
                aria-pressed={following}
                className={cn(
                  "inline-flex items-center gap-1.5 h-11 px-4 rounded-[12px] text-sm font-medium transition-colors",
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
              <Button variant="secondary" size="md" leftIcon={<MessageCircle />}>
                Message
              </Button>
              <Button variant="secondary" size="md" aria-label="Share">
                <Share2 className="size-4" />
              </Button>
              <Button size="md" onClick={() => setSubOpen(true)}>
                Subscribe · {formatNaira(creator.monthlyPrice)}/mo
              </Button>
            </div>
          </div>
        </div>

        {/* Subscribe Now — moved above the tabs */}
        <div className="px-4 sm:px-8 mt-8">
          <SubscriptionPanel creator={creator} onSubscribe={() => setSubOpen(true)} />
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-8 mt-8">
          <Tabs items={tabs} value={tab} onValueChange={setTab} />
        </div>

        {/* Content */}
        <div className="px-4 sm:px-8 mt-6">
          {tab === "posts" ? (
            <div className="flex flex-col gap-4 max-w-3xl">
              {posts.length === 0 ? (
                <EmptyPosts />
              ) : (
                posts.map((p) => <PostCard key={p.id} post={p} creator={creator} />)
              )}
            </div>
          ) : null}

          {tab === "media" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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
      className="inline-flex items-center justify-center size-8 rounded-full bg-white/[0.05] hairline text-white/70 hover:text-white hover:bg-white/[0.08]"
    >
      {children}
    </a>
  );
}

function EmptyPosts() {
  return (
    <div className="surface-card p-10 text-center">
      <p className="text-white/60">No posts yet. Come back soon.</p>
    </div>
  );
}
