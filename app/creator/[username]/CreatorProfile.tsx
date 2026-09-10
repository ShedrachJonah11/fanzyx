"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  DollarSign,
  Heart,
  MessageCircle,
  Pencil,
  Search,
  Share2,
  Users,
} from "lucide-react";
import { InstagramIcon, TikTokIcon, WebsiteIcon, XIcon } from "@/components/icons";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonCircle, SkeletonText } from "@/components/ui/Skeleton";
import { PostCard } from "@/components/PostCard";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { SubscriptionPanel } from "@/components/creator/SubscriptionPanel";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { TipModal } from "@/components/tip/TipModal";
import { ImageCropper } from "@/components/media/ImageCropper";
import { uploadImage } from "@/services/modules/uploads";
import Link from "next/link";
import { type Creator } from "@/lib/mock-data";
import type {
  ExploreCreatorOut,
  PostOut,
  TopSupporterOut,
  UserSocials,
} from "@/services/dtos";
import { discover } from "@/services/modules/discover";
import { users as usersApi } from "@/services/modules/users";
import { cn, formatCompact, formatNaira } from "@/lib/utils";
import { useAuth } from "@/services/context";
import { useFollow, useUserProfile } from "@/services/hooks/users";
import { ApiError } from "@/services/apiClient";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

export function CreatorProfile({
  creator,
  posts: initialPosts,
}: {
  creator: Creator;
  posts: PostOut[];
}) {
  const [posts, setPosts] = useState<PostOut[]>(initialPosts);

  // Keep in sync when the page-level fetch returns a fresh list.
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  const removePost = (id: string) =>
    setPosts((prev) => prev.filter((p) => p.id !== id));
  const replacePost = (updated: PostOut) =>
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  const router = useRouter();
  const [tab, setTab] = useState("posts");
  const [subOpen, setSubOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  const { user, updateMe } = useAuth();
  const isSelf = user?.username === creator.username;

  const [avatarPending, setAvatarPending] = useState<File | null>(null);
  const [coverPending, setCoverPending] = useState<File | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const onPickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarPending(file);
  };
  const onPickCover = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverPending(file);
  };

  const uploadAvatar = async (cropped: File) => {
    setAvatarPending(null);
    setAvatarBusy(true);
    try {
      const url = await uploadImage(cropped, "avatar");
      await updateMe({ avatarUrl: url });
      toast.success("Avatar updated");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.detail ?? e.message : "Couldn't update avatar";
      toast.error(msg);
    } finally {
      setAvatarBusy(false);
    }
  };
  const uploadCover = async (cropped: File) => {
    setCoverPending(null);
    setCoverBusy(true);
    try {
      const url = await uploadImage(cropped, "cover");
      await updateMe({ coverUrl: url });
      toast.success("Cover updated");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.detail ?? e.message : "Couldn't update cover";
      toast.error(msg);
    } finally {
      setCoverBusy(false);
    }
  };

  // Similar creators — top explore results excluding this profile.
  const [similar, setSimilar] = useState<ExploreCreatorOut[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await discover.explore({ sort: "subs", limit: 10 });
        if (cancelled) return;
        setSimilar(
          res.items.filter((c) => c.username !== creator.username).slice(0, 3)
        );
      } catch {
        // Silent — the section just stays empty.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [creator.username]);

  // Recent supporters — public endpoint, same view for owner + visitors.
  const [supporters, setSupporters] = useState<TopSupporterOut[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await usersApi.topSupporters(creator.username, 7);
        if (cancelled) return;
        setSupporters(res.items);
      } catch {
        // Silent — the strip just stays empty.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [creator.username]);

  const profile = useUserProfile(isSelf ? null : creator.username);
  const followState = useFollow(
    creator.username,
    profile.data?.isFollowing ?? undefined
  );
  const following = followState.following;

  // Optimistic follower count — reflect the local follow state immediately.
  // If backend hasn't caught up (data.isFollowing still false while our local
  // state is true), add +1 to whatever the server returned. Symmetric for
  // the unfollow case.
  const backendFollowerCount =
    profile.data?.followerCount ?? creator.followers ?? 0;
  const backendIsFollowing = profile.data?.isFollowing ?? false;
  const displayedFollowerCount =
    following && !backendIsFollowing
      ? backendFollowerCount + 1
      : !following && backendIsFollowing
      ? Math.max(0, backendFollowerCount - 1)
      : backendFollowerCount;

  const handleMessageClick = () => {
    if (isSelf) return;
    const path =
      user?.role === "creator"
        ? `/dashboard/messages?to=${encodeURIComponent(creator.username)}`
        : `/messages?to=${encodeURIComponent(creator.username)}`;
    router.push(path);
  };

  const handleShareClick = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/creator/${creator.username}`
        : `/creator/${creator.username}`;
    const displayName = creator.name || creator.username;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: `${displayName} on FanzyX`,
          text: `Check out ${displayName} on FanzyX`,
          url,
        });
        return;
      } catch {
        // User cancelled or share unsupported — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const handleFollowClick = async () => {
    if (isSelf) return;
    try {
      await followState.toggle();
      // Refetch so backend truth wins on next refresh — updates isFollowing
      // and followerCount from the server.
      await profile.refetch();
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

  const media = posts.filter((p) => {
    const first = p.media[0];
    return !p.locked && first && first.kind !== "audio";
  });

  return (
    <>
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-6 lg:-mb-8 -mb-24 flex items-start">
        {/* ─── Main column (cover + header + content) ─── */}
        <div className="flex-1 min-w-0 flex flex-col pb-24 lg:pb-8">
        {/* Cover with back button overlay */}
        <div className="relative h-48 sm:h-64 overflow-hidden bg-neutral-900">
          {creator.coverImage ? (
            <Image
              src={creator.coverImage}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 1152px"
              className="object-cover object-top"
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

          {/* Change cover — owner only */}
          {isSelf ? (
            <>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={onPickCover}
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverBusy}
                aria-label="Change cover"
                title="Change cover"
                className="on-media absolute top-4 right-4 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[12px] font-semibold hover:bg-black/55 transition-colors disabled:opacity-70"
              >
                {coverBusy ? (
                  <span
                    aria-hidden
                    className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  />
                ) : (
                  <Camera className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {coverBusy ? "Uploading…" : "Cover"}
                </span>
              </button>
            </>
          ) : null}
        </div>

        {/* Header */}
        <div className="px-4 sm:px-8 -mt-14 sm:-mt-16 relative flex flex-col gap-4">
          {/* Row: Avatar (left) + Actions (right, same line) */}
          <div className="flex items-end justify-between gap-4">
            <div className="relative shrink-0">
              <Avatar
                name={creator.name}
                gradient={creator.avatarGradient}
                image={creator.image}
                size={112}
                ring
                className="ring-4 ring-[#07070A]"
              />
              {isSelf ? (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onPickAvatar}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarBusy}
                    aria-label="Change avatar"
                    title="Change avatar"
                    className="on-media absolute -bottom-1 -right-1 inline-flex items-center justify-center size-9 rounded-full bg-black/70 hover:bg-black backdrop-blur ring-2 ring-[#07070A] text-white disabled:opacity-60"
                  >
                    {avatarBusy ? (
                      <span
                        aria-hidden
                        className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"
                      />
                    ) : (
                      <Camera className="size-4" />
                    )}
                  </button>
                </>
              ) : null}
            </div>

            {/* Actions — single straight line, right-aligned */}
            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mt-4 sm:mt-6">
              {isSelf ? (
                <Link
                  href="/dashboard/settings"
                  aria-label="Edit profile"
                  className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold transition-colors shrink-0 bg-white/[0.06] hairline text-white hover:bg-white/[0.1]"
                >
                  <Pencil className="size-4" />
                  Edit profile
                </Link>
              ) : null}
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
              {!isSelf ? (
                <IconAction label="Message" onClick={handleMessageClick}>
                  <MessageCircle className="size-4" />
                </IconAction>
              ) : null}
              {!isSelf ? (
                <IconAction label="Send a tip" onClick={() => setTipOpen(true)}>
                  <DollarSign className="size-4" />
                </IconAction>
              ) : null}
              <IconAction label="Share" onClick={handleShareClick}>
                <Share2 className="size-4" />
              </IconAction>
              <SocialsRow socials={profile.data?.socials ?? undefined} />
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
            <div className="flex items-center gap-1.5 text-sm text-white/60 mt-1 flex-wrap">
              <Users className="size-4" />
              <span className="font-medium text-white">
                {formatCompact(displayedFollowerCount)}
              </span>
              followers
              <span className="text-white/30 mx-1">·</span>
              <span className="font-medium text-white">
                {formatCompact(
                  profile.data?.subscriberCount ?? creator.subscribers
                )}
              </span>
              subscribers
              {creator.monthlyPrice > 0 ? (
                <>
                  <span className="text-white/30 mx-1">·</span>
                  <span>{formatNaira(creator.monthlyPrice)}/mo</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Body — main column content only */}
        <div className="px-4 sm:px-8 mt-8 flex flex-col gap-8">
          {/* Subscribe Now + Bundles */}
          <div id="plans" className="scroll-mt-24">
            <SubscriptionPanel
              creator={creator}
              isSelf={isSelf}
              onSubscribe={() => setSubOpen(true)}
            />
          </div>

          <FeedTabs items={tabs} value={tab} onValueChange={setTab} />

          {tab === "posts" ? (
            <div className="flex flex-col gap-4">
              {posts.length === 0 ? (
                <EmptyPosts />
              ) : (
                posts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    onChange={replacePost}
                    onRemove={removePost}
                  />
                ))
              )}
            </div>
          ) : null}

          {tab === "media" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {media.map((p) => {
                const first = p.media[0];
                const src = first.playbackUrl ?? first.posterUrl;
                return (
                  <div
                    key={p.id}
                    className="relative aspect-square rounded-[12px] overflow-hidden bg-black hairline"
                  >
                    {src ? (
                      first.kind === "video" ? (
                        <video
                          src={src}
                          poster={first.posterUrl ?? undefined}
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={src}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 50vw, 33vw"
                          className="object-cover"
                        />
                      )
                    ) : (
                      <div className="absolute inset-0 bg-gradient-brand-soft" />
                    )}
                  </div>
                );
              })}
              {media.length === 0 ? (
                <div className="col-span-2 sm:col-span-3 surface-card p-10 text-center text-white/55">
                  No media yet.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        </div>

        {/* ─── Right sidebar — full-height, sticky, bleeds to edge ─── */}
        <aside className="hidden lg:flex flex-col shrink-0 w-96 xl:w-[440px] sticky top-0 h-[100dvh] border-l border-white/[0.06] px-5 xl:px-6 py-6 gap-6 overflow-y-auto bg-app">
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
            {similar.length === 0 ? (
              <p className="text-[11px] text-white/45">
                Nothing to show yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {similar.map((c) => {
                  const displayName = c.displayName || c.username;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/creator/${c.username}`}
                        className="flex items-center gap-3 p-2 rounded-[12px] hover:bg-white/[0.04] transition-colors"
                      >
                        <Avatar
                          name={displayName}
                          gradient={BRAND_GRADIENT}
                          image={c.avatarUrl ?? undefined}
                          size={40}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="text-[13px] font-semibold text-white truncate">
                              {displayName}
                            </span>
                            {c.verified ? (
                              <VerifiedBadge className="!size-3" />
                            ) : null}
                          </div>
                          <div className="text-[11px] text-white/55 truncate">
                            @{c.username} · {formatCompact(c.subscriberCount)} subs
                          </div>
                        </div>
                        {c.monthlyPriceKobo ? (
                          <span className="text-[10px] font-semibold text-[#FD23A7] uppercase tracking-wider shrink-0">
                            {formatNaira(c.monthlyPriceKobo / 100, {
                              compact: true,
                            })}
                            /mo
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Recent supporters */}
          <section>
            <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-white/60 mb-3">
              Recent supporters
            </h3>
            {supporters.length > 0 ? (
              <div className="flex items-center -space-x-2 mb-2">
                {supporters.map((s) => (
                  <Link
                    key={s.id}
                    href={`/creator/${s.username}`}
                    title={s.displayName || s.username}
                    className="size-8 rounded-full ring-2 ring-[#0E0E14] overflow-hidden bg-white/[0.06]"
                  >
                    <Avatar
                      name={s.displayName || s.username}
                      gradient={BRAND_GRADIENT}
                      image={s.avatarUrl ?? undefined}
                      size={32}
                    />
                  </Link>
                ))}
              </div>
            ) : null}
            <p className="text-[11px] text-white/55">
              <span className="font-semibold text-white">
                {formatCompact(creator.subscribers)}
              </span>{" "}
              {creator.subscribers === 1 ? "person supports" : "people support"}{" "}
              {creator.name.split(" ")[0]}.
            </p>
          </section>
        </aside>
      </div>

      <SubscriptionModal
        open={subOpen}
        onClose={() => setSubOpen(false)}
        target={{
          username: creator.username,
          displayName: creator.name,
          avatarUrl: creator.image ?? null,
          coverUrl: creator.coverImage ?? null,
          verified: creator.verified,
        }}
      />
      {tipOpen ? (
        <TipModal
          target={{
            username: creator.username,
            displayName: creator.name,
            avatarUrl: creator.image ?? null,
          }}
          onClose={() => setTipOpen(false)}
          onSent={() => profile.refetch()}
        />
      ) : null}

      {avatarPending ? (
        <ImageCropper
          open
          file={avatarPending}
          aspect={1}
          outputWidth={512}
          circle
          title="Adjust your avatar"
          onCropped={uploadAvatar}
          onClose={() => setAvatarPending(null)}
        />
      ) : null}
      {coverPending ? (
        <ImageCropper
          open
          file={coverPending}
          aspect={3}
          outputWidth={1200}
          size="lg"
          title="Adjust your cover"
          onCropped={uploadCover}
          onClose={() => setCoverPending(null)}
        />
      ) : null}
    </>
  );
}

function SocialsRow({ socials }: { socials?: UserSocials | null }) {
  if (!socials) return null;
  const items: {
    key: keyof UserSocials;
    label: string;
    href: string;
    icon: React.ReactNode;
  }[] = [];

  const ig = socials.instagram?.trim();
  if (ig) {
    items.push({
      key: "instagram",
      label: "Instagram",
      href: `https://instagram.com/${ig.replace(/^@/, "")}`,
      icon: <InstagramIcon className="size-4" />,
    });
  }
  const x = socials.x?.trim();
  if (x) {
    items.push({
      key: "x",
      label: "X",
      href: `https://x.com/${x.replace(/^@/, "")}`,
      icon: <XIcon className="size-4" />,
    });
  }
  const tt = socials.tiktok?.trim();
  if (tt) {
    items.push({
      key: "tiktok",
      label: "TikTok",
      href: `https://tiktok.com/@${tt.replace(/^@/, "")}`,
      icon: <TikTokIcon className="size-4" />,
    });
  }
  const site = socials.website?.trim();
  if (site) {
    items.push({
      key: "website",
      label: "Website",
      href: /^https?:\/\//.test(site) ? site : `https://${site}`,
      icon: <WebsiteIcon className="size-4" />,
    });
  }

  if (items.length === 0) return null;

  return (
    <>
      <span className="hidden sm:inline-block w-px h-6 bg-white/[0.08] mx-1 shrink-0" />
      {items.map((it) => (
        <SocialButton key={it.key} href={it.href} label={it.label}>
          {it.icon}
        </SocialButton>
      ))}
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
      target="_blank"
      rel="noopener noreferrer"
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
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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

/* ─── Skeleton ─────────────────────────────────────────────────────── */

/**
 * Placeholder shown while a creator profile is loading. Mirrors the
 * cover + avatar + stats layout of the real page so the transition
 * doesn't jump.
 */
export function CreatorProfileSkeleton() {
  return (
    <div className="flex flex-col" aria-busy aria-label="Loading profile">
      <Skeleton className="h-40 sm:h-56 w-full rounded-none" />
      <div className="px-4 sm:px-8 -mt-10 flex flex-col gap-5">
        <div className="flex items-end gap-4">
          <SkeletonCircle size={88} className="ring-4 ring-[var(--bg)]" />
          <div className="flex-1 flex flex-col gap-2 pb-2">
            <Skeleton className="h-5 w-48 rounded-full" />
            <Skeleton className="h-3.5 w-28 rounded-full" />
          </div>
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>

        <SkeletonText lines={2} widths={["100%", "72%"]} />

        <div className="flex gap-6">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-10 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-10 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-10 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-[14px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
