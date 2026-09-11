import { apiClient, tokenStore } from "../apiClient";
import type {
  AdminDashboardOut,
  AdminPostRemoveIn,
  AdminUserBanIn,
  AdminUserOut,
  AdminUserRoleIn,
  AuditOut,
  AuthOut,
  IdentityRejectIn,
  IdentityReviewFilter,
  IdentityReviewOut,
  Ok,
  Page,
  PlatformFeeOut,
  PlatformFeeSource,
  PlatformSettingsOut,
  PlatformSettingsPatch,
  PlatformSummaryOut,
  ReportActionIn,
  ReportOut,
  ReportStatus,
  Role,
} from "../dtos";

export interface AdminLoginDto {
  email: string;
  password: string;
}

export const adminAuth = {
  /** Admin-only login (single-admin email allowlist on the server). */
  login: async (dto: AdminLoginDto) => {
    const res = await apiClient.post<AuthOut>(
      "/v1/auth/admin/login",
      dto,
      { auth: false }
    );
    tokenStore.set(res.tokens.accessToken, res.tokens.refreshToken);
    return res;
  },
};

export const admin = {
  /* ── Dashboard ─────────────────────────────────────── */
  dashboard: () => apiClient.get<AdminDashboardOut>("/v1/admin/dashboard"),

  /* ── Identity queue ────────────────────────────────── */
  identityList: (params?: {
    status?: IdentityReviewFilter;
    cursor?: string;
    limit?: number;
  }) =>
    apiClient.get<Page<IdentityReviewOut>>("/v1/admin/identity", {
      query: params,
    }),
  identityApprove: (userId: string) =>
    apiClient.post<Ok>(`/v1/admin/identity/${userId}/approve`),
  identityReject: (userId: string, dto: IdentityRejectIn) =>
    apiClient.post<Ok>(`/v1/admin/identity/${userId}/reject`, dto),

  /* ── Reports ───────────────────────────────────────── */
  reportsList: (params?: {
    status?: ReportStatus;
    cursor?: string;
    limit?: number;
  }) =>
    apiClient.get<Page<ReportOut>>("/v1/admin/reports", { query: params }),
  reportAction: (reportId: string, dto: ReportActionIn) =>
    apiClient.post<Ok>(`/v1/admin/reports/${reportId}/action`, dto),

  /* ── Users ─────────────────────────────────────────── */
  usersList: (params?: {
    role?: Role;
    search?: string;
    cursor?: string;
    limit?: number;
  }) =>
    apiClient.get<Page<AdminUserOut>>("/v1/admin/users", { query: params }),
  userVerify: (userId: string) =>
    apiClient.post<Ok>(`/v1/admin/users/${userId}/verify`),
  userBan: (userId: string, dto: AdminUserBanIn) =>
    apiClient.post<Ok>(`/v1/admin/users/${userId}/ban`, dto),
  userRole: (userId: string, dto: AdminUserRoleIn) =>
    apiClient.post<AdminUserOut>(`/v1/admin/users/${userId}/role`, dto),

  /* ── Post moderation ──────────────────────────────── */
  postRemove: (postId: string, dto: AdminPostRemoveIn) =>
    apiClient.post<Ok>(`/v1/admin/posts/${postId}/remove`, dto),

  /* ── Platform revenue + settings ───────────────────── */
  platformSummary: () =>
    apiClient.get<PlatformSummaryOut>("/v1/admin/platform/summary"),
  platformRevenue: (params?: {
    from?: string;
    to?: string;
    sourceKind?: PlatformFeeSource;
    cursor?: string;
    limit?: number;
  }) =>
    apiClient.get<Page<PlatformFeeOut>>("/v1/admin/platform/revenue", {
      query: params,
    }),
  platformSettings: () =>
    apiClient.get<PlatformSettingsOut>("/v1/admin/platform/settings"),
  updatePlatformSettings: (patch: PlatformSettingsPatch) =>
    apiClient.patch<PlatformSettingsOut>("/v1/admin/platform/settings", patch),

  /* ── Audit log ─────────────────────────────────────── */
  auditList: (params?: {
    actorUserId?: string;
    action?: string;
    entityType?: string;
    cursor?: string;
    limit?: number;
  }) =>
    apiClient.get<Page<AuditOut>>("/v1/admin/audit", { query: params }),
};
