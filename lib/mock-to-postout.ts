import type { PostOut } from "@/services/dtos";
import type { Creator, Post } from "@/lib/mock-data";

/**
 * Temporary adapter: convert the legacy mock Post + Creator shape into the
 * real PostOut so pages that still render from mock data can consume
 * <PostCard>. Delete once every page is wired to the real backend.
 */
export function mockToPostOut(post: Post, creator: Creator): PostOut {
  return {
    id: post.id,
    creator: {
      id: creator.id,
      username: creator.username,
      displayName: creator.name,
      avatarUrl: creator.image ?? null,
      verified: creator.verified,
    },
    caption: post.caption,
    visibility: post.ppvPrice ? "ppv" : post.locked ? "subscribers" : "free",
    ppvPriceKobo: post.ppvPrice ? Math.round(post.ppvPrice * 100) : null,
    status: post.status === "published" ? "published" : post.status,
    scheduledFor: post.scheduledFor ?? null,
    publishedAt: post.status === "published" ? post.timestamp : null,
    allowComments: true,
    viewCount: post.views,
    likeCount: post.likes,
    commentCount: post.comments,
    liked: false,
    bookmarked: false,
    locked: post.locked,
    unlock: post.locked
      ? post.ppvPrice
        ? { kind: "ppv", priceKobo: Math.round(post.ppvPrice * 100) }
        : { kind: "subscribe", priceKobo: null }
      : null,
    media: post.locked
      ? []
      : [
          {
            id: `${post.id}_m0`,
            kind: post.mediaKind,
            status: "ready",
            posterUrl: null,
            playbackUrl: null,
            width: null,
            height: null,
            durationMs: null,
          },
        ],
    tags: [],
    poll: null,
    createdAt: post.timestamp,
  };
}
