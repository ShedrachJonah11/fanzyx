export type ID = string;
export type ISODate = string;
export type Kobo = number;

export type Role = "fan" | "creator" | "admin";
export type Visibility = "public" | "subscribers" | "ppv";
export type MediaKind = "image" | "video" | "audio";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "expired";
export type PayoutStatus = "pending" | "processing" | "paid" | "failed";
export type TxKind =
  | "topup"
  | "subscription"
  | "ppv"
  | "tip"
  | "payout"
  | "refund"
  | "fee";
export type TxStatus = "pending" | "successful" | "failed" | "reversed";

export interface Paginated<T> {
  data: T[];
  cursor: string | null;
  hasMore: boolean;
}

export interface AuthUser {
  id: ID;
  email: string;
  username: string;
  role: Role;
  displayName: string;
  avatarUrl: string | null;
  isCreator: boolean;
  verified: boolean;
  createdAt: ISODate;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface SignupFanDto {
  email: string;
  username: string;
  password: string;
  phone?: string;
  referralCode?: string;
}

export interface SignupCreatorDto {
  email: string;
  username: string;
  phone: string;
  referralCode?: string;
}

export interface VerifyOtpDto {
  email: string;
  code: string;
}

export interface SetPasswordDto {
  email: string;
  password: string;
}

export interface LoginDto {
  identifier: string;
  password: string;
}

export interface CreatorProfile {
  id: ID;
  userId: ID;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  location: string | null;
  website: string | null;
  socials: { instagram?: string; x?: string };
  verified: boolean;
  subscriberCount: number;
  postCount: number;
  likeCount: number;
  monthlyPriceKobo: Kobo;
  bundles: SubscriptionBundle[];
  isFollowing?: boolean;
  isSubscribed?: boolean;
  lastSeenAt: ISODate | null;
  createdAt: ISODate;
}

export interface SubscriptionBundle {
  id: ID;
  months: number;
  discountPct: number;
  priceKobo: Kobo;
}

export interface Post {
  id: ID;
  authorId: ID;
  author: {
    id: ID;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
  };
  text: string | null;
  media: PostMedia[];
  visibility: Visibility;
  priceKobo: Kobo | null;
  likeCount: number;
  commentCount: number;
  tipCount: number;
  liked: boolean;
  bookmarked: boolean;
  unlocked: boolean;
  createdAt: ISODate;
}

export interface PostMedia {
  id: ID;
  kind: MediaKind;
  url: string;
  previewUrl: string | null;
  width: number | null;
  height: number | null;
  durationSec: number | null;
}

export interface CreatePostDto {
  text?: string;
  mediaIds?: ID[];
  visibility: Visibility;
  priceKobo?: Kobo;
}

export interface Comment {
  id: ID;
  postId: ID;
  authorId: ID;
  author: { username: string; displayName: string; avatarUrl: string | null };
  text: string;
  likeCount: number;
  liked: boolean;
  createdAt: ISODate;
}

export interface Subscription {
  id: ID;
  fanId: ID;
  creatorId: ID;
  creator: Pick<
    CreatorProfile,
    "id" | "username" | "displayName" | "avatarUrl" | "verified"
  >;
  status: SubscriptionStatus;
  bundleId: ID | null;
  priceKobo: Kobo;
  startsAt: ISODate;
  renewsAt: ISODate | null;
  cancelledAt: ISODate | null;
}

export interface Wallet {
  id: ID;
  userId: ID;
  balanceKobo: Kobo;
  pendingKobo: Kobo;
  currency: "NGN";
}

export interface WalletTransaction {
  id: ID;
  walletId: ID;
  kind: TxKind;
  status: TxStatus;
  amountKobo: Kobo;
  balanceAfterKobo: Kobo;
  reference: string;
  meta: Record<string, unknown>;
  createdAt: ISODate;
}

export interface TopupInitDto {
  amountKobo: Kobo;
  channel?: "card" | "bank" | "ussd";
}

export interface TopupInitResponse {
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}

export interface Tip {
  id: ID;
  fromUserId: ID;
  toCreatorId: ID;
  amountKobo: Kobo;
  postId: ID | null;
  message: string | null;
  createdAt: ISODate;
}

export interface SendTipDto {
  toCreatorId: ID;
  amountKobo: Kobo;
  postId?: ID;
  message?: string;
}

export interface Payout {
  id: ID;
  creatorId: ID;
  amountKobo: Kobo;
  status: PayoutStatus;
  bankAccount: BankAccount;
  reference: string;
  requestedAt: ISODate;
  paidAt: ISODate | null;
}

export interface BankAccount {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface Conversation {
  id: ID;
  peer: {
    id: ID;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
  };
  lastMessage: Message | null;
  unreadCount: number;
  pinned: boolean;
  updatedAt: ISODate;
}

export interface Message {
  id: ID;
  conversationId: ID;
  senderId: ID;
  text: string | null;
  mediaUrl: string | null;
  status: "sent" | "delivered" | "read";
  createdAt: ISODate;
}

export interface SendMessageDto {
  conversationId?: ID;
  toUserId?: ID;
  text?: string;
  mediaId?: ID;
}

export interface Notification {
  id: ID;
  kind:
    | "like"
    | "comment"
    | "tip"
    | "subscription"
    | "message"
    | "follow"
    | "system";
  actorId: ID | null;
  actor: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  entityUrl: string | null;
  text: string;
  read: boolean;
  createdAt: ISODate;
}

export interface UploadInitDto {
  filename: string;
  contentType: string;
  sizeBytes: number;
  kind: MediaKind;
}

export interface UploadInitResponse {
  mediaId: ID;
  uploadUrl: string;
  headers: Record<string, string>;
}
