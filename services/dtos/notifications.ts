export type NotificationKind =
  | "subscribe"
  | "renewal"
  | "tip"
  | "comment"
  | "reply"
  | "mention"
  | "follow"
  | "post_new"
  | "live_start"
  | "payout_paid"
  | "referral_converted"
  | "identity_verified"
  | "identity_rejected"
  | "posts_published"
  | "moderation"
  | "system";

export interface NotificationOut {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  actorUserId: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}
