import type { IdentityDocumentType } from "./identity";
import type { Role } from "./auth";

/* ── Dashboard ─────────────────────────────────────────── */

export interface AdminDashboardOut {
  totalUsers?: number | null;
  activeCreators?: number | null;
  activeSubscriptions?: number | null;
  revenueKobo?: number | null;
  tipsKobo?: number | null;
  payoutsPending?: number | null;
  /** Time-range label, e.g. "Last 30 days". Server-defined. */
  periodLabel?: string;
}

/* ── Identity queue ────────────────────────────────────── */

export type IdentityReviewStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "none";
export type IdentityReviewFilter = IdentityReviewStatus | "all";
export type IdentityRejectionCode =
  | "blurry_id"
  | "name_mismatch"
  | "expired_doc"
  | "selfie_mismatch";

export interface IdentityReviewDocument {
  kind: "id_front" | "id_back" | "selfie";
  mediaId: string;
  /** Signed URL — expires in ~10 min. Refetch the row before rendering. */
  url: string;
  uploadedAt: string;
}

export interface IdentityReviewOut {
  submissionId: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  status: IdentityReviewStatus;
  country: string;
  documentType: IdentityDocumentType;
  idNumberLast4: string;
  documents: IdentityReviewDocument[];
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  rejectionCode: string | null;
}

export interface IdentityRejectIn {
  reason: string;
  code: IdentityRejectionCode;
}

/* ── Reports ───────────────────────────────────────────── */

export type ReportStatus = "open" | "actioned" | "dismissed";
export type ReportAction = "remove_post" | "ban_user" | "dismiss";
export type ReportTargetKind = "post" | "user" | "message" | "comment";

export interface ReportOut {
  id: string;
  reason: string;
  status: ReportStatus;
  reporter: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  target: {
    kind: ReportTargetKind;
    id: string;
    label: string;
    /** Optional deep-link (e.g. `/creator/@bob` or `/post/xyz`). */
    href?: string | null;
  };
  createdAt: string;
  reviewerNote: string | null;
  reviewedAt: string | null;
}

export interface ReportActionIn {
  action: ReportAction;
  note?: string;
}

/* ── Users ─────────────────────────────────────────────── */

export interface AdminUserOut {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  verified: boolean;
  is18: boolean;
  onboardingCompletedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  lastActiveAt: string | null;
}

export interface AdminUserBanIn {
  reason: string;
  /** Omit / null = permanent. */
  durationDays?: number | null;
}

export interface AdminUserRoleIn {
  role: Role;
}

/* ── Post moderation ──────────────────────────────────── */

export interface AdminPostRemoveIn {
  reason: string;
}

/* ── Platform revenue + settings ───────────────────────── */

export type PlatformFeeSource = "subscription" | "tip" | "ppv";

export interface PlatformSummaryOut {
  totalRevenueKobo?: number | null;
  subscriptionKobo?: number | null;
  tipsKobo?: number | null;
  ppvKobo?: number | null;
  feesCollectedKobo?: number | null;
  periodLabel?: string;
}

export interface PlatformFeeOut {
  id: string;
  sourceKind: PlatformFeeSource;
  grossKobo: number;
  feeKobo: number;
  netKobo: number;
  creatorUserId: string;
  creatorUsername: string;
  fanUserId: string | null;
  fanUsername: string | null;
  createdAt: string;
}

export interface PlatformSettingsOut {
  feeBpSubscription: number; // basis points; 1000 = 10%
  feeBpTip: number;
  feeBpPpv: number;
  minTopupKobo: number;
  minPayoutKobo: number;
  minTipKobo: number;
  updatedAt: string;
  updatedByUserId: string | null;
}

export type PlatformSettingsPatch = Partial<
  Pick<
    PlatformSettingsOut,
    | "feeBpSubscription"
    | "feeBpTip"
    | "feeBpPpv"
    | "minTopupKobo"
    | "minPayoutKobo"
    | "minTipKobo"
  >
>;

/* ── Audit log ─────────────────────────────────────────── */

export interface AuditOut {
  id: string;
  actorUserId: string;
  actorUsername: string;
  action: string; // e.g. "identity.approve", "user.ban"
  entityType: string; // e.g. "user", "post", "report"
  entityId: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
  ip: string | null;
}
