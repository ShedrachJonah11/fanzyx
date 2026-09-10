"use client";

import { create } from "zustand";
import { notifications as api } from "../modules/notifications";
import type { NotificationOut } from "../dtos";

export type NotificationsFilter = "all" | "unread";

const PAGE_LIMIT = 20;

type NotificationsState = {
  items: NotificationOut[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
  filter: NotificationsFilter;
  loading: boolean;
  loadingMore: boolean;
  loaded: boolean;
  error: string | null;

  setFilter: (f: NotificationsFilter) => void;
  hydrate: (filter?: NotificationsFilter) => Promise<void>;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  reset: () => void;
};

// TODO(ws): once the backend emits `notification:new` on /v1/ws, wire a
// subscriber in MessagingProvider (or a NotificationsProvider) that calls
// something like `applyIncoming(notification)` here and increments unreadCount.

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  nextCursor: null,
  hasMore: false,
  unreadCount: 0,
  filter: "all",
  loading: false,
  loadingMore: false,
  loaded: false,
  error: null,

  setFilter: (f) => {
    if (get().filter === f) return;
    set({ filter: f });
  },

  hydrate: async (filter) => {
    const nextFilter = filter ?? get().filter;
    set({
      filter: nextFilter,
      loading: true,
      loaded: false,
      error: null,
      items: [],
      nextCursor: null,
      hasMore: false,
    });
    try {
      const page = await api.list({
        read: nextFilter === "unread" ? false : undefined,
        limit: PAGE_LIMIT,
      });
      const localUnread = page.items.filter((n) => !n.readAt).length;
      set((s) => ({
        items: page.items,
        nextCursor: page.nextCursor,
        hasMore: !!page.nextCursor,
        loading: false,
        loaded: true,
        unreadCount: Math.max(s.unreadCount, localUnread),
      }));
      get().refreshUnreadCount();
    } catch (e) {
      set({
        loading: false,
        loaded: true,
        error: e instanceof Error ? e.message : "Failed to load notifications",
      });
    }
  },

  loadMore: async () => {
    const { nextCursor, loadingMore, loading, filter } = get();
    if (!nextCursor || loadingMore || loading) return;
    set({ loadingMore: true });
    try {
      const page = await api.list({
        read: filter === "unread" ? false : undefined,
        cursor: nextCursor,
        limit: PAGE_LIMIT,
      });
      set((s) => ({
        items: [...s.items, ...page.items],
        nextCursor: page.nextCursor,
        hasMore: !!page.nextCursor,
        loadingMore: false,
      }));
    } catch {
      set({ loadingMore: false });
    }
  },

  markRead: async (id) => {
    const { items } = get();
    const target = items.find((n) => n.id === id);
    if (!target || target.readAt) return;
    const now = new Date().toISOString();
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, readAt: now } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
    try {
      await api.markRead(id);
    } catch {
      // Roll back on failure.
      set((s) => ({
        items: s.items.map((n) =>
          n.id === id ? { ...n, readAt: target.readAt } : n
        ),
        unreadCount: s.unreadCount + 1,
      }));
    }
  },

  markAllRead: async () => {
    const { items, unreadCount } = get();
    if (unreadCount === 0) return;
    const now = new Date().toISOString();
    const snapshot = items;
    set((s) => ({
      items: s.items.map((n) => (n.readAt ? n : { ...n, readAt: now })),
      unreadCount: 0,
    }));
    try {
      await api.markAllRead();
    } catch {
      set({ items: snapshot, unreadCount });
    }
  },

  refreshUnreadCount: async () => {
    try {
      // Spec says limit=1 — cheapest way to answer "any unread?". The list
      // endpoint doesn't return a total count, so treat this as a binary
      // signal: 0 → no unread, ≥1 → at least one. Preserve any higher local
      // count derived from the visible list.
      const page = await api.list({ read: false, limit: 1 });
      const serverHasUnread = page.items.length > 0;
      set((s) => {
        const localUnread = s.items.filter((n) => !n.readAt).length;
        const next = serverHasUnread ? Math.max(localUnread, 1) : localUnread;
        return { unreadCount: next };
      });
    } catch {
      // Ignore polling failures — they'll retry on the next tick.
    }
  },

  reset: () =>
    set({
      items: [],
      nextCursor: null,
      hasMore: false,
      unreadCount: 0,
      filter: "all",
      loading: false,
      loadingMore: false,
      loaded: false,
      error: null,
    }),
}));
