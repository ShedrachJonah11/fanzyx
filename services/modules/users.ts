import { apiClient } from "../apiClient";
import type {
  ChangePasswordDto,
  MeOut,
  ReportIn,
  UpdateMeIn,
  UserPublic,
} from "../dtos";

export const users = {
  /* ── self ─────────────────────────────────────────── */
  update: (patch: UpdateMeIn) => apiClient.patch<MeOut>("/v1/me", patch),
  /** Alias for `update` — kept for backwards compatibility. */
  updateMe: (patch: UpdateMeIn) => apiClient.patch<MeOut>("/v1/me", patch),
  confirmAge: () => apiClient.post<MeOut>("/v1/me/confirm-age"),
  deleteMe: () => apiClient.delete<void>("/v1/me"),
  changePassword: (dto: ChangePasswordDto) =>
    apiClient.post<{ ok: true }>("/v1/me/password", dto),

  /* ── public profile ──────────────────────────────── */
  byUsername: (username: string) =>
    apiClient.get<UserPublic>(`/v1/users/${username}`),

  /* ── relationships ───────────────────────────────── */
  follow: (username: string) =>
    apiClient.post<void>(`/v1/users/${username}/follow`),
  unfollow: (username: string) =>
    apiClient.delete<void>(`/v1/users/${username}/follow`),
  block: (username: string) =>
    apiClient.post<void>(`/v1/users/${username}/block`),
  unblock: (username: string) =>
    apiClient.delete<void>(`/v1/users/${username}/block`),
  report: (username: string, dto: ReportIn) =>
    apiClient.post<void>(`/v1/users/${username}/report`, dto),
};
