import { apiClient } from "../apiClient";
import type {
  Ok,
  Page,
  PostCreateIn,
  PostOut,
  PostUpdateIn,
  ReportIn,
} from "../dtos";

export type CreatorPostsFilter = "all" | "photos" | "videos";
export type MinePostsStatus = "all" | "drafts" | "scheduled" | "published";

export const posts = {
  /* ── CRUD ─────────────────────────────────────────── */
  create: (dto: PostCreateIn) => apiClient.post<PostOut>("/v1/posts", dto),

  update: (id: string, dto: PostUpdateIn) =>
    apiClient.patch<PostOut>(`/v1/posts/${id}`, dto),

  publish: (id: string) =>
    apiClient.post<PostOut>(`/v1/posts/${id}/publish`),

  delete: (id: string) =>
    apiClient.delete<Ok>(`/v1/posts/${id}`),

  get: (id: string) => apiClient.get<PostOut>(`/v1/posts/${id}`),

  /* ── PPV unlock — requires per-click Idempotency-Key ── */
  unlock: (id: string, idempotencyKey: string) =>
    apiClient.post<PostOut>(`/v1/posts/${id}/unlock`, undefined, {
      idempotencyKey,
    }),

  /* ── Poll vote ────────────────────────────────────── */
  vote: (id: string, optionIndex: number) =>
    apiClient.post<PostOut>(`/v1/posts/${id}/poll/vote`, { optionIndex }),

  /* ── Interactions (all idempotent) ────────────────── */
  like: (id: string) => apiClient.post<Ok>(`/v1/posts/${id}/like`),
  unlike: (id: string) => apiClient.delete<Ok>(`/v1/posts/${id}/like`),
  bookmark: (id: string) => apiClient.post<Ok>(`/v1/posts/${id}/bookmark`),
  unbookmark: (id: string) => apiClient.delete<Ok>(`/v1/posts/${id}/bookmark`),

  /* ── Report ───────────────────────────────────────── */
  report: (id: string, dto: ReportIn) =>
    apiClient.post<Ok>(`/v1/posts/${id}/report`, dto),

  /* ── Listings ─────────────────────────────────────── */
  byCreator: (
    username: string,
    params?: { filter?: CreatorPostsFilter; cursor?: string; limit?: number }
  ) =>
    apiClient.get<Page<PostOut>>(`/v1/creators/${username}/posts`, {
      query: params,
    }),

  mine: (params?: {
    status?: MinePostsStatus;
    cursor?: string;
    limit?: number;
  }) => apiClient.get<Page<PostOut>>("/v1/me/posts", { query: params }),

  bookmarks: (params?: { cursor?: string; limit?: number }) =>
    apiClient.get<Page<PostOut>>("/v1/me/bookmarks", { query: params }),
};
