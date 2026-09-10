import type { UserSocials } from "./users";

export type ULID = string;
export type ISODate = string;

export type Role = "fan" | "creator" | "admin" | "moderator";
export type IdentityStatus = "none" | "pending" | "verified" | "rejected";
export type OtpChannel = "email" | "sms";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface MeOut {
  id: ULID;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  role: Role;
  verified: boolean;
  is18: boolean;
  email: string | null;
  phoneE164: string | null;
  identityStatus: IdentityStatus;
  emailVerifiedAt: ISODate | null;
  phoneVerifiedAt: ISODate | null;
  referralCode: string;
  createdAt: ISODate;
  onboardingCompletedAt: ISODate | null;
  payoutAccount: PayoutAccountSummary | null;
  twoFactorEnabled: boolean;
  socials: UserSocials | null;
}

export interface PayoutAccountSummary {
  bankCode: string;
  bankName: string | null;
  accountNumberMasked: string;
  accountName: string | null;
}

export interface AuthOut {
  tokens: TokenPair;
  user: MeOut;
}

export interface SignupFanDto {
  username: string;
  email: string;
  password: string;
  age18: true;
  emailOptin?: boolean;
  referralCode?: string;
}

export interface SignupCreatorStartDto {
  username: string;
  email: string;
  phone: string;
  referralCode?: string;
}

export interface CreatorFlowResponse {
  flowId: string;
  verified: boolean;
  next: "verify" | "password" | "identity" | "done";
}

export interface SignupCreatorVerifyDto {
  flowId: string;
  code: string;
}

export interface SignupCreatorPasswordDto {
  flowId: string;
  password: string;
}

export interface LoginDto {
  emailOrUsername: string;
  password: string;
}

export interface LoginChallenge {
  challengeId: string;
  next: "totp";
}

export interface LoginTotpDto {
  challengeId: string;
  code: string;
}

export type LoginResponse = AuthOut | LoginChallenge;

export function isLoginChallenge<T extends object>(
  r: T | LoginChallenge
): r is LoginChallenge {
  return (
    typeof r === "object" &&
    r !== null &&
    "next" in r &&
    (r as { next?: unknown }).next === "totp" &&
    "challengeId" in r
  );
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface TwoFactorSetupOut {
  secret: string;
  qrCodeUrl: string;
}

export interface TwoFactorEnableDto {
  code: string;
}

export interface TwoFactorEnableOut {
  ok: true;
  backupCodes: string[];
}

export interface TwoFactorDisableDto {
  code: string;
}

export interface GoogleAuthDto {
  idToken: string;
  role?: Role;
}

export interface GoogleCallbackDto {
  code: string;
  redirectUri: string;
  state?: string;
  role?: Role;
}

export interface GoogleNoAccountError {
  code: "no_account";
  email?: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface LogoutDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface EmailVerifyRequestOut {
  sent: boolean;
  alreadyVerified: boolean;
}

export interface ResendOtpDto {
  flowId: string;
  channel: OtpChannel;
}

/* ── Errors (RFC 7807) ─────────────────────────────────────────────────── */

export type AuthErrorCode =
  | "invalid_credentials"
  | "account_disabled"
  | "username_taken"
  | "email_taken"
  | "refresh_reuse"
  | "invalid_refresh"
  | "token_expired"
  | "flow_expired"
  | "invalid_otp"
  | "not_verified"
  | "weak_password"
  | "rate_limited"
  | "age_required"
  | "identity_required"
  | (string & {});

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: AuthErrorCode;
  detail?: string;
  trace_id: string;
}
