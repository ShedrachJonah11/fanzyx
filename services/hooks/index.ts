"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../apiClient";
import {
  creators,
  messages,
  notifications,
  posts,
  subscriptions,
  wallet,
} from "../modules";
import type {
  Conversation,
  CreatorProfile,
  ID,
  Notification,
  Paginated,
  Post,
  Subscription,
  Wallet,
  WalletTransaction,
} from "../dtos";

export interface AsyncState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = []
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fn();
      if (mounted.current) setState({ data, error: null, loading: false });
    } catch (e) {
      const err =
        e instanceof ApiError ? e : new ApiError(0, (e as Error).message, null);
      if (mounted.current) setState({ data: null, error: err, loading: false });
    }

  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, refetch: run };
}

export interface PaginatedState<T> {
  items: T[];
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
  error: ApiError | null;
}

export function usePaginated<T>(
  fetcher: (cursor?: string) => Promise<Paginated<T>>,
  deps: React.DependencyList = []
) {
  const [state, setState] = useState<PaginatedState<T>>({
    items: [],
    cursor: null,
    hasMore: true,
    loading: false,
    error: null,
  });

  const loadMore = useCallback(async () => {
    setState((s) => {
      if (s.loading || !s.hasMore) return s;
      return { ...s, loading: true };
    });
    try {
      const page = await fetcher(state.cursor ?? undefined);
      setState((s) => ({
        items: [...s.items, ...page.data],
        cursor: page.cursor,
        hasMore: page.hasMore,
        loading: false,
        error: null,
      }));
    } catch (e) {
      const err =
        e instanceof ApiError ? e : new ApiError(0, (e as Error).message, null);
      setState((s) => ({ ...s, loading: false, error: err }));
    }
  }, [fetcher, state.cursor]);

  const reset = useCallback(() => {
    setState({
      items: [],
      cursor: null,
      hasMore: true,
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    reset();

  }, deps);

  return { ...state, loadMore, reset };
}

export function useFeed(tab: "following" | "for-you") {
  return usePaginated<Post>((cursor) => posts.feed(tab, cursor), [tab]);
}

export function useCreator(username: string) {
  return useAsync<CreatorProfile>(
    () => creators.byUsername(username),
    [username]
  );
}

export function useFeaturedCreators() {
  return useAsync<CreatorProfile[]>(() => creators.featured(), []);
}

export function useCreatorPosts(username: string) {
  return usePaginated<Post>(
    (cursor) => posts.byCreator(username, cursor),
    [username]
  );
}

export function useSubscriptions() {
  return useAsync<Subscription[]>(() => subscriptions.list(), []);
}

export function useWallet() {
  return useAsync<Wallet>(() => wallet.me(), []);
}

export function useWalletTransactions() {
  return usePaginated<WalletTransaction>(
    (cursor) => wallet.transactions(cursor),
    []
  );
}

export function useConversations() {
  return useAsync<Conversation[]>(() => messages.conversations(), []);
}

export function useNotifications() {
  return usePaginated<Notification>(
    (cursor) => notifications.list(cursor),
    []
  );
}

export function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = useCallback(() => setOn((v) => !v), []);
  return { on, toggle, setOn };
}

export function useAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const run = useCallback(
    async (...args: TArgs) => {
      setLoading(true);
      setError(null);
      try {
        return await action(...args);
      } catch (e) {
        const err =
          e instanceof ApiError
            ? e
            : new ApiError(0, (e as Error).message, null);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [action]
  );

  return { run, loading, error };
}

export function useLikePost(id: ID) {
  return useAction(() => posts.like(id));
}

export function useUnlikePost(id: ID) {
  return useAction(() => posts.unlike(id));
}

export function useFollowCreator(creatorId: ID) {
  return useAction(() => creators.follow(creatorId));
}
