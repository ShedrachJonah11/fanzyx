"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../apiClient";
import { users as usersApi } from "../modules/users";
import type { ReportIn, UserPublic } from "../dtos";
import { useAction, useAsync } from "./utils";

/**
 * localStorage-backed record of who this device has followed. Acts as a
 * source of truth when the backend's GET /v1/users/{username} response
 * doesn't reflect the follow yet (eventual consistency / cache lag).
 */
const LOCAL_FOLLOWS_KEY = "fanzyx.follows";

function loadLocalFollows(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(LOCAL_FOLLOWS_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveLocalFollows(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LOCAL_FOLLOWS_KEY,
      JSON.stringify([...set])
    );
  } catch {
    /* quota / disabled — ignore */
  }
}

function markLocalFollow(username: string, followed: boolean) {
  const s = loadLocalFollows();
  if (followed) s.add(username);
  else s.delete(username);
  saveLocalFollows(s);
}

function hasLocalFollow(username: string): boolean {
  return loadLocalFollows().has(username);
}

/* ── profile fetch ─────────────────────────────────────── */

export function useUserProfile(username: string | null | undefined) {
  return useAsync<UserPublic | null>(async () => {
    if (!username) return null;
    return usersApi.byUsername(username);
  }, [username]);
}

/* ── follow / unfollow with optimistic toggle ─────────── */

export interface UseFollowResult {
  following: boolean;
  loading: boolean;
  error: ApiError | null;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  toggle: () => Promise<void>;
}

export function useFollow(
  username: string,
  initialFollowing?: boolean
): UseFollowResult {
  const [following, setFollowing] = useState<boolean>(() => {
    // Prefer local record so the state survives refresh even when the
    // backend momentarily returns isFollowing:false after a fresh follow.
    if (username && hasLocalFollow(username)) return true;
    return initialFollowing ?? false;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!username) return;
    if (hasLocalFollow(username)) {
      setFollowing(true);
      return;
    }
    if (initialFollowing !== undefined) setFollowing(initialFollowing);
  }, [initialFollowing, username]);

  const set = useCallback(
    async (target: boolean) => {
      const prev = following;
      if (prev === target || loading) return;
      setFollowing(target);
      setLoading(true);
      setError(null);
      try {
        if (target) await usersApi.follow(username);
        else await usersApi.unfollow(username);
        markLocalFollow(username, target);
      } catch (e) {
        setFollowing(prev);
        const err =
          e instanceof ApiError ? e : new ApiError(0, (e as Error).message, null);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [username, following, loading]
  );

  return {
    following,
    loading,
    error,
    follow: () => set(true),
    unfollow: () => set(false),
    toggle: () => set(!following),
  };
}

/* ── block / unblock with optimistic toggle ───────────── */

export interface UseBlockUserResult {
  blocked: boolean;
  loading: boolean;
  error: ApiError | null;
  block: () => Promise<void>;
  unblock: () => Promise<void>;
  toggle: () => Promise<void>;
}

export function useBlockUser(
  username: string,
  initialBlocked?: boolean
): UseBlockUserResult {
  const [blocked, setBlocked] = useState<boolean>(initialBlocked ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (initialBlocked !== undefined) setBlocked(initialBlocked);
  }, [initialBlocked]);

  const set = useCallback(
    async (target: boolean) => {
      const prev = blocked;
      if (prev === target || loading) return;
      setBlocked(target);
      setLoading(true);
      setError(null);
      try {
        if (target) await usersApi.block(username);
        else await usersApi.unblock(username);
      } catch (e) {
        setBlocked(prev);
        const err =
          e instanceof ApiError ? e : new ApiError(0, (e as Error).message, null);
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [username, blocked, loading]
  );

  return {
    blocked,
    loading,
    error,
    block: () => set(true),
    unblock: () => set(false),
    toggle: () => set(!blocked),
  };
}

/* ── report ────────────────────────────────────────────── */

export function useReportUser(username: string) {
  return useAction((dto: ReportIn) => usersApi.report(username, dto));
}
