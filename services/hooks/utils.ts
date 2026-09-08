"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../apiClient";

export interface AsyncState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

function toApiError(e: unknown): ApiError {
  return e instanceof ApiError ? e : new ApiError(0, (e as Error)?.message ?? "Unknown", null);
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = []
): AsyncState<T> & { refetch: () => Promise<void> } {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await run();
      if (mounted.current) setState({ data, error: null, loading: false });
    } catch (e) {
      const err = toApiError(e);
      if (mounted.current) setState({ data: null, error: err, loading: false });
    }
  }, [run]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await refetch();
    })();
    return () => {
      cancelled = true;
    };
  }, [refetch]);

  return { ...state, refetch };
}

export function useAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      setLoading(true);
      setError(null);
      try {
        return await action(...args);
      } catch (e) {
        const err = toApiError(e);
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
