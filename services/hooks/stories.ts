"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { stories } from "../modules/stories";
import { ApiError } from "../apiClient";
import type { StoryFeedGroupOut, StoryOut } from "../dtos";

const POLL_MS = 2 * 60 * 1000; // 2 minutes

type State = {
  items: StoryFeedGroupOut[];
  loading: boolean;
  loaded: boolean;
  error: ApiError | null;
};

/**
 * Fetches the stories tray and keeps it fresh:
 * - refetches on tab focus (visibilitychange)
 * - refetches every 2 minutes while the tab is visible
 * - `refresh()` for manual reload (e.g. after posting a story)
 *
 * Silently no-ops when the caller isn't authed (feed requires auth) — the
 * hook just stays in a `loaded: true, items: []` state.
 */
export function useStoriesFeed(enabled = true) {
  const [state, setState] = useState<State>({
    items: [],
    loading: enabled,
    loaded: false,
    error: null,
  });
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await stories.feed();
      setState({
        items: res.items,
        loading: false,
        loaded: true,
        error: null,
      });
    } catch (e) {
      if (e instanceof ApiError) {
        // 401 (no auth) or 404 (endpoint not deployed yet) → just empty,
        // no toast. Anything else surfaces so real backend/network issues
        // don't fail silently.
        const silent = e.status === 401 || e.status === 404;
        if (!silent) {
          toast.error(e.detail ?? "Couldn't load stories");
        }
        setState((prev) => ({
          items: silent ? [] : prev.items,
          loading: false,
          loaded: true,
          error: silent ? null : e,
        }));
      } else {
        setState((prev) => ({ ...prev, loading: false, loaded: true }));
      }
    } finally {
      inFlight.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, load]);

  useEffect(() => {
    if (!enabled) return;
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVis);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(timer);
    };
  }, [enabled, load]);

  return {
    items: state.items,
    loading: state.loading,
    loaded: state.loaded,
    error: state.error,
    refresh: load,
  };
}

type MyState = {
  items: StoryOut[];
  loading: boolean;
  loaded: boolean;
};

/**
 * Fetches the current user's own active stories. Used to show the "Your
 * story" avatar with a brand ring + open the own-story player, the same
 * WhatsApp/Instagram pattern. Silently no-ops when `username` is null.
 */
export function useMyStories(username: string | null) {
  const [state, setState] = useState<MyState>({
    items: [],
    loading: !!username,
    loaded: false,
  });
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (!username) return;
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const list = await stories.byUser(username);
      setState({ items: list, loading: false, loaded: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setState({ items: [], loading: false, loaded: true });
      } else {
        setState((prev) => ({ ...prev, loading: false, loaded: true }));
      }
    } finally {
      inFlight.current = false;
    }
  }, [username]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [username, load]);

  return {
    items: state.items,
    loading: state.loading,
    loaded: state.loaded,
    refresh: load,
  };
}
