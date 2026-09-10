"use client";

import { create } from "zustand";
import { messages, presence } from "../modules/messages";
import { newIdempotencyKey } from "@/lib/idempotency";
import { ApiError } from "../apiClient";
import type {
  ConversationFilter,
  ConversationOut,
  MessageAttachment,
  MessageOut,
  PresenceEntry,
  SendAttachmentIn,
  SendMessageIn,
} from "../dtos";

const TYPING_EXPIRY_MS = 4_000;

export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type LocalMessage = MessageOut & {
  /** Client-side transient status — server never sends this. */
  status?: MessageStatus;
  /** Local tempId for optimistic messages before the server assigns an id. */
  tempId?: string;
};

type ConvCursor = {
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
  loaded: boolean;
};

type MessagingState = {
  meId: string | null;
  conversations: Record<string, ConversationOut>;
  convOrder: string[]; // sorted by lastMessageAt desc
  convListLoading: boolean;
  convListLoaded: boolean;

  messagesByConv: Record<string, LocalMessage[]>;
  messagePagination: Record<string, ConvCursor>;

  presenceByUser: Record<string, PresenceEntry>;
  typingByConv: Record<string, { userId: string; expiresAt: number } | null>;
  deliveredByMsgId: Record<string, string>; // ISO
  readUpToByConv: Record<string, string>; // messageId

  filter: ConversationFilter;

  // Actions
  setMeId: (id: string | null) => void;
  reset: () => void;
  setFilter: (f: ConversationFilter) => void;

  hydrateConversations: () => Promise<void>;
  loadMessages: (convId: string) => Promise<void>;
  loadMoreMessages: (convId: string) => Promise<void>;

  openConversation: (convId: string) => Promise<void>;
  sendMessage: (
    convId: string,
    body: string,
    opts?: {
      attachments?: MessageAttachment[];
      replyToId?: string;
      priceKobo?: number;
      previewBody?: string;
    }
  ) => Promise<void>;
  resendMessage: (convId: string, tempId: string) => Promise<void>;
  removeLocalMessage: (convId: string, id: string) => void;
  markRead: (convId: string) => Promise<void>;
  togglePin: (convId: string, next: boolean) => Promise<void>;
  toggleMute: (convId: string, next: boolean) => Promise<void>;
  deleteConversation: (convId: string) => Promise<void>;
  unlockMessage: (convId: string, messageId: string) => Promise<void>;

  applyIncomingMessage: (convId: string, msg: MessageOut) => void;
  applyPresence: (userId: string, entry: PresenceEntry) => void;
  bulkPresence: (map: Record<string, PresenceEntry>) => void;
  applyTyping: (convId: string, userId: string) => void;
  applyDelivered: (msgId: string, at: string) => void;
  applyRead: (convId: string, upToId: string) => void;
  applyUnlocked: (convId: string, messageId: string, unlockCount: number) => void;
};

function sortConvOrder(conversations: Record<string, ConversationOut>): string[] {
  return Object.values(conversations)
    .sort((a, b) => {
      // Pinned first
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    })
    .map((c) => c.id);
}

export const useMessagingStore = create<MessagingState>((set, get) => ({
  meId: null,
  conversations: {},
  convOrder: [],
  convListLoading: false,
  convListLoaded: false,

  messagesByConv: {},
  messagePagination: {},

  presenceByUser: {},
  typingByConv: {},
  deliveredByMsgId: {},
  readUpToByConv: {},

  filter: "all",

  setMeId: (id) => set({ meId: id }),

  reset: () =>
    set({
      meId: null,
      conversations: {},
      convOrder: [],
      convListLoading: false,
      convListLoaded: false,
      messagesByConv: {},
      messagePagination: {},
      presenceByUser: {},
      typingByConv: {},
      deliveredByMsgId: {},
      readUpToByConv: {},
      filter: "all",
    }),

  setFilter: (f) => set({ filter: f }),

  hydrateConversations: async () => {
    if (get().convListLoading) return;
    set({ convListLoading: true });
    try {
      const page = await messages.listConversations({
        filter: get().filter,
        limit: 30,
      });
      const map: Record<string, ConversationOut> = {};
      for (const c of page.items) map[c.id] = c;
      set({
        conversations: map,
        convOrder: sortConvOrder(map),
        convListLoading: false,
        convListLoaded: true,
      });

      // Fire-and-forget presence hydrate for everyone in the list.
      const otherIds = page.items.map((c) => c.other.id);
      if (otherIds.length > 0) {
        presence.get(otherIds).then((res) => {
          set({ presenceByUser: { ...get().presenceByUser, ...res } });
        }).catch(() => {});
      }
    } catch {
      set({ convListLoading: false, convListLoaded: true });
    }
  },

  loadMessages: async (convId) => {
    const existing = get().messagePagination[convId];
    if (existing?.loading) return;
    set({
      messagePagination: {
        ...get().messagePagination,
        [convId]: {
          cursor: existing?.cursor ?? null,
          hasMore: existing?.hasMore ?? true,
          loading: true,
          loaded: existing?.loaded ?? false,
        },
      },
    });
    try {
      const page = await messages.listMessages(convId, { limit: 30 });
      // Backend returns newest first — reverse so the array reads oldest → newest.
      const ordered = [...page.items].reverse();
      set({
        messagesByConv: {
          ...get().messagesByConv,
          [convId]: ordered,
        },
        messagePagination: {
          ...get().messagePagination,
          [convId]: {
            cursor: page.nextCursor,
            hasMore: page.nextCursor !== null,
            loading: false,
            loaded: true,
          },
        },
      });
    } catch {
      set({
        messagePagination: {
          ...get().messagePagination,
          [convId]: {
            cursor: existing?.cursor ?? null,
            hasMore: existing?.hasMore ?? false,
            loading: false,
            loaded: true,
          },
        },
      });
    }
  },

  loadMoreMessages: async (convId) => {
    const pag = get().messagePagination[convId];
    if (!pag || pag.loading || !pag.hasMore || !pag.cursor) return;
    set({
      messagePagination: {
        ...get().messagePagination,
        [convId]: { ...pag, loading: true },
      },
    });
    try {
      const page = await messages.listMessages(convId, {
        cursor: pag.cursor,
        limit: 30,
      });
      // Older messages get prepended.
      const older = [...page.items].reverse();
      const current = get().messagesByConv[convId] ?? [];
      set({
        messagesByConv: {
          ...get().messagesByConv,
          [convId]: [...older, ...current],
        },
        messagePagination: {
          ...get().messagePagination,
          [convId]: {
            cursor: page.nextCursor,
            hasMore: page.nextCursor !== null,
            loading: false,
            loaded: true,
          },
        },
      });
    } catch {
      set({
        messagePagination: {
          ...get().messagePagination,
          [convId]: { ...pag, loading: false },
        },
      });
    }
  },

  openConversation: async (convId) => {
    const state = get();
    if (!state.messagePagination[convId]?.loaded) {
      await state.loadMessages(convId);
    }
    await state.markRead(convId);
  },

  sendMessage: async (convId, body, opts) => {
    const trimmed = body.trim();
    if (!trimmed && !opts?.attachments?.length) return;
    const meId = get().meId ?? "me";
    const tempId = newIdempotencyKey();
    const now = new Date().toISOString();

    const priceKobo = opts?.priceKobo && opts.priceKobo > 0 ? opts.priceKobo : null;
    const previewBody =
      priceKobo && opts?.previewBody ? opts.previewBody : null;
    const optimistic: LocalMessage = {
      id: tempId,
      tempId,
      conversationId: convId,
      fromUserId: meId,
      body: trimmed || null,
      attachments: opts?.attachments ?? null,
      replyToId: opts?.replyToId ?? null,
      createdAt: now,
      editedAt: null,
      deletedAt: null,
      status: "sending",
      priceKobo,
      previewBody,
      // Sender always sees their own message unlocked.
      locked: false,
      unlockedByMe: true,
      unlockCount: 0,
    };
    const current = get().messagesByConv[convId] ?? [];
    set({
      messagesByConv: {
        ...get().messagesByConv,
        [convId]: [...current, optimistic],
      },
    });

    // Server only needs mediaId (+ waveform for audio). We keep the fuller
    // MessageAttachment shape locally for the optimistic bubble render.
    const apiAttachments: SendAttachmentIn[] | undefined = opts?.attachments
      ?.filter((a) => !!a.mediaId)
      .map((a) => ({
        mediaId: a.mediaId,
        ...(a.waveform ? { waveform: a.waveform } : {}),
      }));
    const dto: SendMessageIn = {
      body: trimmed || undefined,
      attachments:
        apiAttachments && apiAttachments.length > 0
          ? apiAttachments
          : undefined,
      replyToId: opts?.replyToId,
      priceKobo: priceKobo ?? undefined,
      previewBody: previewBody ?? undefined,
    };

    try {
      const saved = await messages.send(convId, dto);
      // If the server response is missing/empty attachments but we sent some,
      // preserve the local attachments so the sender's bubble still shows the
      // media. The recipient will get the server-side attachments via WS.
      const localAtts = optimistic.attachments;
      const serverAtts = saved.attachments;
      const mergedAtts =
        serverAtts && serverAtts.length > 0
          ? serverAtts
          : localAtts && localAtts.length > 0
          ? localAtts
          : serverAtts ?? null;
      if (
        localAtts &&
        localAtts.length > 0 &&
        (!serverAtts || serverAtts.length === 0)
      ) {
        console.warn(
          "[messaging] send response returned no attachments; " +
            "preserving local previews. Check backend attachment plumbing."
        );
      }
      const merged: LocalMessage = {
        ...saved,
        attachments: mergedAtts,
        status: "sent" as MessageStatus,
      };
      // Swap optimistic → server row.
      const list = get().messagesByConv[convId] ?? [];
      set({
        messagesByConv: {
          ...get().messagesByConv,
          [convId]: list.map((m) => (m.tempId === tempId ? merged : m)),
        },
      });

      // Bump the conversation to the top with the new lastMessage.
      const conv = get().conversations[convId];
      if (conv) {
        const nextConv: ConversationOut = {
          ...conv,
          lastMessage: merged,
          lastMessageAt: merged.createdAt,
        };
        const conversations = { ...get().conversations, [convId]: nextConv };
        set({
          conversations,
          convOrder: sortConvOrder(conversations),
        });
      }
    } catch (e) {
      const list = get().messagesByConv[convId] ?? [];
      set({
        messagesByConv: {
          ...get().messagesByConv,
          [convId]: list.map((m) =>
            m.tempId === tempId ? { ...m, status: "failed" as MessageStatus } : m
          ),
        },
      });
      if (!(e instanceof ApiError)) throw e;
    }
  },

  resendMessage: async (convId, tempId) => {
    const list = get().messagesByConv[convId] ?? [];
    const failed = list.find((m) => m.tempId === tempId || m.id === tempId);
    if (!failed || failed.status !== "failed") return;
    // Drop the failed placeholder — sendMessage will insert a fresh optimistic
    // row with a new tempId.
    set({
      messagesByConv: {
        ...get().messagesByConv,
        [convId]: list.filter((m) => m !== failed),
      },
    });
    await get().sendMessage(convId, failed.body ?? "", {
      attachments: failed.attachments ?? undefined,
      replyToId: failed.replyToId ?? undefined,
      priceKobo: failed.priceKobo ?? undefined,
      previewBody: failed.previewBody ?? undefined,
    });
  },

  removeLocalMessage: (convId, id) => {
    const list = get().messagesByConv[convId] ?? [];
    set({
      messagesByConv: {
        ...get().messagesByConv,
        [convId]: list.filter((m) => m.id !== id && m.tempId !== id),
      },
    });
  },

  markRead: async (convId) => {
    try {
      await messages.markRead(convId);
      // Clear unread count locally.
      const conv = get().conversations[convId];
      if (conv && conv.unreadCount > 0) {
        set({
          conversations: {
            ...get().conversations,
            [convId]: { ...conv, unreadCount: 0 },
          },
        });
      }
    } catch {
      // Silent — read receipts are best-effort.
    }
  },

  togglePin: async (convId, next) => {
    // Optimistic
    const conv = get().conversations[convId];
    if (!conv) return;
    const conversations = {
      ...get().conversations,
      [convId]: { ...conv, pinned: next },
    };
    set({ conversations, convOrder: sortConvOrder(conversations) });
    try {
      if (next) await messages.pin(convId);
      else await messages.unpin(convId);
    } catch {
      // Revert
      const reverted = {
        ...get().conversations,
        [convId]: { ...conv, pinned: !next },
      };
      set({ conversations: reverted, convOrder: sortConvOrder(reverted) });
    }
  },

  toggleMute: async (convId, next) => {
    const conv = get().conversations[convId];
    if (!conv) return;
    set({
      conversations: {
        ...get().conversations,
        [convId]: { ...conv, muted: next },
      },
    });
    try {
      if (next) await messages.mute(convId);
      else await messages.unmute(convId);
    } catch {
      set({
        conversations: {
          ...get().conversations,
          [convId]: { ...conv, muted: !next },
        },
      });
    }
  },

  deleteConversation: async (convId) => {
    const state = get();
    const conv = state.conversations[convId];
    if (!conv) return;

    // Optimistic remove — snapshot everything so we can revert on failure.
    const snapshot = {
      conversations: state.conversations,
      convOrder: state.convOrder,
      messagesByConv: state.messagesByConv,
      messagePagination: state.messagePagination,
    };
    const { [convId]: _dropConv, ...restConvs } = state.conversations;
    const { [convId]: _dropMsgs, ...restMsgs } = state.messagesByConv;
    const { [convId]: _dropPag, ...restPag } = state.messagePagination;
    void _dropConv;
    void _dropMsgs;
    void _dropPag;
    set({
      conversations: restConvs,
      convOrder: state.convOrder.filter((id) => id !== convId),
      messagesByConv: restMsgs,
      messagePagination: restPag,
    });

    try {
      await messages.deleteConversation(convId);
    } catch (e) {
      // Revert on failure so the row reappears — caller shows a toast.
      set(snapshot);
      throw e;
    }
  },

  unlockMessage: async (convId, messageId) => {
    const list = get().messagesByConv[convId] ?? [];
    const target = list.find((m) => m.id === messageId);
    if (!target || target.unlockedByMe) return;
    const key = newIdempotencyKey();
    const unlocked = await messages.unlock(messageId, key);
    // Swap in the full unlocked message (body + attachments now populated).
    const currentList = get().messagesByConv[convId] ?? [];
    set({
      messagesByConv: {
        ...get().messagesByConv,
        [convId]: currentList.map((m) => (m.id === messageId ? unlocked : m)),
      },
    });
  },

  applyIncomingMessage: (convId, msg) => {
    const list = get().messagesByConv[convId] ?? [];
    // De-dupe (WS can race with the REST send response).
    if (list.some((m) => m.id === msg.id)) return;
    set({
      messagesByConv: {
        ...get().messagesByConv,
        [convId]: [...list, msg],
      },
    });
    const conv = get().conversations[convId];
    if (conv) {
      const isSelf = msg.fromUserId === get().meId;
      const nextConv: ConversationOut = {
        ...conv,
        lastMessage: msg,
        lastMessageAt: msg.createdAt,
        unreadCount: isSelf ? conv.unreadCount : conv.unreadCount + 1,
      };
      const conversations = { ...get().conversations, [convId]: nextConv };
      set({ conversations, convOrder: sortConvOrder(conversations) });
    }
  },

  applyPresence: (userId, entry) =>
    set({
      presenceByUser: { ...get().presenceByUser, [userId]: entry },
    }),

  bulkPresence: (map) =>
    set({
      presenceByUser: { ...get().presenceByUser, ...map },
    }),

  applyTyping: (convId, userId) => {
    set({
      typingByConv: {
        ...get().typingByConv,
        [convId]: { userId, expiresAt: Date.now() + TYPING_EXPIRY_MS },
      },
    });
    // Auto-clear after the expiry.
    window.setTimeout(() => {
      const cur = get().typingByConv[convId];
      if (cur && cur.expiresAt <= Date.now()) {
        set({
          typingByConv: { ...get().typingByConv, [convId]: null },
        });
      }
    }, TYPING_EXPIRY_MS + 100);
  },

  applyDelivered: (msgId, at) => {
    set({
      deliveredByMsgId: { ...get().deliveredByMsgId, [msgId]: at },
    });
    // Update the message status if it's still in-cache.
    const state = get();
    for (const [convId, list] of Object.entries(state.messagesByConv)) {
      const idx = list.findIndex((m) => m.id === msgId);
      if (idx < 0) continue;
      const current = list[idx];
      if (current.status === "read") return; // don't downgrade
      set({
        messagesByConv: {
          ...state.messagesByConv,
          [convId]: [
            ...list.slice(0, idx),
            { ...current, status: "delivered" as MessageStatus },
            ...list.slice(idx + 1),
          ],
        },
      });
      return;
    }
  },

  applyRead: (convId, upToId) => {
    set({
      readUpToByConv: { ...get().readUpToByConv, [convId]: upToId },
    });
    // Flip all matching own-messages to "read".
    const state = get();
    const list = state.messagesByConv[convId];
    if (!list) return;
    const me = state.meId;
    // Find the index of upToId, or if not found flip everything (upto is authoritative)
    const upToIdx = list.findIndex((m) => m.id === upToId);
    const cutoff = upToIdx >= 0 ? upToIdx : list.length - 1;
    const updated = list.map((m, i) =>
      i <= cutoff && m.fromUserId === me
        ? { ...m, status: "read" as MessageStatus }
        : m
    );
    set({
      messagesByConv: { ...state.messagesByConv, [convId]: updated },
    });
  },

  applyUnlocked: (convId, messageId, unlockCount) => {
    const list = get().messagesByConv[convId];
    if (!list) return;
    const updated = list.map((m) =>
      m.id === messageId ? { ...m, unlockCount } : m
    );
    set({
      messagesByConv: { ...get().messagesByConv, [convId]: updated },
    });
  },
}));
