import type { Role } from "./auth";

/* Public subset of MeOut returned by GET /v1/users/{username} */
export interface UserPublic {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  role: Role;
  createdAt: string;
  /* creator extras, present when role === "creator" */
  subscriberCount?: number;
  postCount?: number;
  socials?: UserSocials;
  /* relationship flags — present when caller is authed */
  isFollowing?: boolean;
  isBlocked?: boolean;
  isSelf?: boolean;
}

export interface UserSocials {
  instagram?: string;
  x?: string;
  tiktok?: string;
  website?: string;
}

export interface UpdateMeIn {
  username?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  socials?: UserSocials;
  is18?: boolean; // only false→true is honored
}

export type ReportReason =
  | "spam"
  | "harassment"
  | "csam"
  | "impersonation"
  | "nudity_minor"
  | "copyright"
  | "other";

export interface ReportIn {
  reason: ReportReason;
  detail?: string;
}
