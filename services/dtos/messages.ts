import type { CreatorMini } from "./posts";

export type MessageAttachmentKind = "image" | "video" | "audio";

/** As returned on a MessageOut — populated by the backend from the mediaId. */
export interface MessageAttachment {
  kind: MessageAttachmentKind;
  mediaId: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  /** audio + video */
  durationMs: number | null;
  /** video thumbnail — null for now */
  posterUrl: string | null;
  /** audio only, 4–256 float samples in [0,1] */
  waveform: number[] | null;
}

/** What the client sends on POST /conversations/{id}/messages. */
export interface SendAttachmentIn {
  mediaId: string;
  /** audio only — array of RMS samples in [0,1] */
  waveform?: number[];
}

export interface MessageOut {
  id: string;
  conversationId: string;
  fromUserId: string;
  body: string | null;
  attachments: MessageAttachment[] | null;
  replyToId: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  /** PPV: price in kobo. null for free messages. */
  priceKobo?: number | null;
  /** PPV: optional teaser shown while locked. */
  previewBody?: string | null;
  /** PPV: true while unpaid and viewer isn't the sender. */
  locked?: boolean;
  /** PPV: has the current viewer unlocked this message? */
  unlockedByMe?: boolean;
  /** PPV: aggregate unlock count (for the creator's own view). */
  unlockCount?: number;
}

export interface ConversationOut {
  id: string;
  other: CreatorMini;
  lastMessage: MessageOut | null;
  lastMessageAt: string | null;
  unreadCount: number;
  pinned: boolean;
  muted: boolean;
}

export type ConversationFilter = "all" | "unread" | "pinned";

export interface StartConversationIn {
  withUsername: string;
}

export interface SendMessageIn {
  body?: string;
  attachments?: SendAttachmentIn[];
  replyToId?: string;
  /** PPV: creator-only. Kobo. Omit or 0 for a free message. */
  priceKobo?: number;
  /** PPV: optional teaser (max 280 chars). Only stored when price > 0. */
  previewBody?: string;
}

export interface PresenceEntry {
  online: boolean;
  lastSeenAt: string | null;
}

export type PresenceMap = Record<string, PresenceEntry>;

/* ── WebSocket event types ─────────────────────────────────── */

export type WsClientEvent =
  | { type: "heartbeat" }
  | { type: "typing"; conversation_id: string }
  | { type: "read"; conversation_id: string; up_to_message_id: string };

export type WsServerEvent =
  | { type: "hello"; user_id: string; at: string }
  | {
      type: "presence";
      user_id: string;
      online: boolean;
      at: string;
    }
  | {
      type: "message:new";
      conversation_id: string;
      message: MessageOut;
    }
  | {
      type: "message:delivered";
      conversation_id: string;
      message_id: string;
      to_user_id: string;
      at: string;
    }
  | {
      type: "typing";
      conversation_id: string;
      user_id: string;
      at: string;
    }
  | {
      type: "message:read";
      conversation_id: string;
      up_to_message_id: string;
      user_id: string;
      at: string;
    }
  | {
      type: "message:unlocked";
      conversation_id: string;
      message_id: string;
      user_id: string;
      unlock_count: number;
      at: string;
    }
  | {
      type: "identity:updated";
      status: "verified" | "rejected";
      rejection_code: string | null;
      at: string;
    };
