export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "") as string;

const ACCESS_TOKEN_KEY = "fanzyx.accessToken";
const REFRESH_TOKEN_KEY = "fanzyx.refreshToken";

export type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions extends Omit<RequestInit, "body" | "headers"> {
  query?: Query;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  idempotencyKey?: string;
  isForm?: boolean;
}

export class ApiError<T = unknown> extends Error {
  status: number;
  data: T | null;
  constructor(status: number, message: string, data: T | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
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
  if (type.includes("application/json")) return res.json();
  const text = await res.text();
  return text.length ? text : null;
}

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
    ...init
  } = opts;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
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

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : null) ?? res.statusText ?? "Request failed";
    throw new ApiError(res.status, message, data);
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
