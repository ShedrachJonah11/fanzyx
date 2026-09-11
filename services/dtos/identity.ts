import type { IdentityStatus } from "./auth";

export type IdentityDocumentType =
  | "bvn"
  | "nin"
  | "drivers_license"
  | "passport";

/** Document kinds shown on GET /v1/me/identity. */
export type IdentityDocumentKind = "id_front" | "id_back" | "selfie";

export interface IdentityDocumentOut {
  kind: IdentityDocumentKind;
  mediaId: string;
  uploadedAt: string;
}

export interface IdentityOut {
  status: IdentityStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  rejectionCode: string | null;
  documents: IdentityDocumentOut[];
}

export interface IdentitySubmitIn {
  country: string; // ISO-3166 alpha-2 (e.g. "NG")
  documentType: IdentityDocumentType;
  idNumber: string;
  idFrontMediaId?: string; // required unless documentType === "bvn"
  idBackMediaId?: string; // required for nin + drivers_license
  selfieMediaId: string;
}
