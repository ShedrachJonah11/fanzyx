import type { CreatorMini } from "./posts";

export interface MessageAttachment {
  url: string;
  type?: string;
  width?: number;
  height?: number;
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
  attachments?: MessageAttachment[];
  replyToId?: string;
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
    };
