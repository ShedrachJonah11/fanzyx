
export type PostVisibility = "free" | "subscribers" | "ppv";
export type PostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "archived"
  | "removed"
  /** Author isn't identity-verified yet — post is stored but hidden from
   *  public feeds. Flips to "published" once the creator gets verified. */
  | "pending_verification";
export type PostMediaKind = "image" | "video" | "audio";
export type PostMediaStatus = "uploading" | "processing" | "ready" | "failed";

export interface CreatorMini {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  verified: boolean;
}

export interface MediaOut {
  id: string;
  kind: PostMediaKind;
  status: PostMediaStatus;
  posterUrl: string | null;
  playbackUrl: string | null;
  width: number | null;
  height: number | null;
  durationMs: number | null;
}

export interface PostUnlock {
  kind: "subscribe" | "ppv";
  priceKobo: number | null;
}

export interface PollOut {
  question: string;
  options: string[]; // 2..5
  expiresAt: string | null;
  votes: number[]; // aligned to options[]
  totalVotes: number;
  userVoteIndex: number | null;
  expired: boolean;
  canVote: boolean;
}

export interface PostOut {
  id: string;
  creator: CreatorMini;
  caption: string | null;
  visibility: PostVisibility;
  ppvPriceKobo: number | null;
  status: PostStatus;
  scheduledFor: string | null;
  publishedAt: string | null;
  allowComments: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  bookmarked: boolean;
  locked: boolean;
  unlock: PostUnlock | null;
  media: MediaOut[];
  tags: string[];
  poll: PollOut | null;
  createdAt: string;
  /**
   * Post is stored but hidden from the public feed because the author
   * hasn't been identity-verified yet. Backend flips this to false + moves
   * the post into the public feed once the creator's identityStatus
   * becomes "verified". Only present on the author's own view.
   */
  hiddenPendingVerification?: boolean;
}

export interface PostPollIn {
  question: string; // max 200
  options: string[]; // 2..5, each max 80
  expiresAt?: string; // ISO, must be future
}

export interface PostVoteIn {
  optionIndex: number;
}

export interface PostCreateIn {
  caption?: string;
  visibility: PostVisibility;
  ppvPriceKobo?: number;
  mediaIds?: string[];
  scheduledFor?: string;
  allowComments?: boolean;
  sendNotification?: boolean;
  publish?: boolean;
  tags?: string[]; // up to 10, lowercase [a-z0-9_], no spaces
  poll?: PostPollIn;
}

export interface PostUpdateIn {
  caption?: string;
  visibility?: PostVisibility;
  ppvPriceKobo?: number;
  allowComments?: boolean;
  scheduledFor?: string;
}

