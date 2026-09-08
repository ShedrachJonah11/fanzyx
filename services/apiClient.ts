import type { AuthErrorCode, ProblemDetails, TokenPair } from "./dtos";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "") as string;

const ACCESS_TOKEN_KEY = "fanzyx.accessToken";
const REFRESH_TOKEN_KEY = "fanzyx.refreshToken";
const AUTH_COOKIE = "fanzyx.at";
const LOGIN_PATH = "/login";

/**
 * Mirror the access token to a cookie so Next.js middleware can gate protected
 * routes at the edge without needing to touch localStorage. Not httpOnly — JS
 * still needs to read the token from localStorage for Authorization headers;
 * the cookie is purely a "logged in?" signal for the edge.
 */
function writeAuthCookie(token: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_COOKIE}=${token}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function deleteAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  query?: Query;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  idempotencyKey?: string;
  isForm?: boolean;
  _retry?: boolean;
}

export class ApiError<T = unknown> extends Error {
  status: number;
  code: AuthErrorCode;
  detail?: string;
  traceId?: string;
  data: T | null;
  constructor(
    status: number,
    message: string,
    data: T | null,
    code: AuthErrorCode = "unknown",
    detail?: string,
    traceId?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.traceId = traceId;
    this.data = data;
  }
}

export const tokenStore = {
  getAccess(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(access: string, refresh?: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    writeAuthCookie(access);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    deleteAuthCookie();
  },
};

function buildUrl(path: string, query?: Query): string {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${suffix}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function parseBody(res: Response): Promise<unknown> {
  const type = res.headers.get("content-type") ?? "";
  if (
    type.includes("application/json") ||
    type.includes("application/problem+json")
  ) {
    return res.json().catch(() => null);
  }
  const text = await res.text();
  return text.length ? text : null;
}

function toApiError(status: number, data: unknown, fallback: string): ApiError {
  if (data && typeof data === "object") {
    const p = data as Partial<ProblemDetails> & { message?: string };
    const message =
      p.detail ?? p.title ?? p.message ?? fallback ?? "Request failed";
    return new ApiError(
      status,
      message,
      data,
      p.code ?? "unknown",
      p.detail,
      p.trace_id
    );
  }
  return new ApiError(status, fallback, data ?? null);
}

/* ── refresh coordination ──────────────────────────────────────────────── */

let refreshInFlight: Promise<TokenPair | null> | null = null;
let onAuthExpired: ((nextPath: string) => void) | null = null;
let onOnboardingRequired: ((code: string) => void) | null = null;

export function setOnAuthExpired(handler: (nextPath: string) => void) {
  onAuthExpired = handler;
}

export function setOnOnboardingRequired(handler: (code: string) => void) {
  onOnboardingRequired = handler;
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = window.location.pathname + window.location.search;
  if (window.location.pathname.startsWith(LOGIN_PATH)) return;
  if (onAuthExpired) {
    onAuthExpired(next);
    return;
  }
  // Hard redirect fallback used only when no AuthProvider has registered a handler.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `${LOGIN_PATH}?next=${encodeURIComponent(next)}`;
}

async function refreshAccessToken(): Promise<TokenPair | null> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(buildUrl("/v1/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "1",
        },
        body: JSON.stringify({ refreshToken }),
      });
      const data = (await parseBody(res)) as
        | (TokenPair & Record<string, unknown>)
        | ProblemDetails
        | null;
      if (!res.ok) {
        const code =
          data && typeof data === "object" && "code" in data
            ? (data as ProblemDetails).code
            : "invalid_refresh";
        tokenStore.clear();
        if (code === "refresh_reuse" || code === "invalid_refresh") {
          redirectToLogin();
        }
        return null;
      }
      const pair = data as TokenPair;
      tokenStore.set(pair.accessToken, pair.refreshToken);
      return pair;
    } catch {
      tokenStore.clear();
      redirectToLogin();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/* ── request ───────────────────────────────────────────────────────────── */

export async function request<T = unknown>(
  method: string,
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  const {
    query,
    body,
    headers = {},
    auth = true,
    idempotencyKey,
    isForm = false,
    _retry = false,
    ...init
  } = opts;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    // Bypasses ngrok-free's browser warning interstitial (harmless off-ngrok).
    "ngrok-skip-browser-warning": "1",
    ...headers,
  };

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (isForm && body instanceof FormData) {
      payload = body;
    } else {
      finalHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  if (auth) {
    const token = tokenStore.getAccess();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (idempotencyKey) finalHeaders["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(buildUrl(path, query), {
    method,
    headers: finalHeaders,
    body: payload,
    ...init,
  });

  const data = await parseBody(res);

  if (res.status === 401 && auth && !_retry) {
    const code =
      data && typeof data === "object" && "code" in data
        ? String((data as ProblemDetails).code)
        : null;
    if (code === "token_expired" || code === null) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request<T>(method, path, { ...opts, _retry: true });
      }
    }
    if (code === "refresh_reuse" || code === "invalid_refresh") {
      tokenStore.clear();
      redirectToLogin();
    }
  }

  if (res.status === 409 && data && typeof data === "object" && "code" in data) {
    const code = String((data as ProblemDetails).code);
    if (
      (code === "onboarding_incomplete" || code === "age_required") &&
      onOnboardingRequired
    ) {
      onOnboardingRequired(code);
    }
  }

  if (!res.ok) {
    throw toApiError(res.status, data, res.statusText || "Request failed");
  }

  return data as T;
}

export const apiClient = {
  get: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, opts),
  post: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, { ...opts, body }),
  put: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, { ...opts, body }),
  patch: <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, { ...opts, body }),
  delete: <T = unknown>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, opts),
};
