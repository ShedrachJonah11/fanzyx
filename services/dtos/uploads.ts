export type UploadKind =
  | "avatar"
  | "cover"
  | "image"
  | "video"
  | "audio"
  | "identity";

export interface UploadInitIn {
  filename: string;
  contentType: string;
  sizeBytes: number;
  kind: UploadKind;
}

export interface UploadInitOut {
  mediaId: string;
  uploadUrl: string;
  headers: Record<string, string>;
  publicUrl: string;
  expiresIn: number;
}

export interface UploadCompleteOut {
  ok: true;
  publicUrl: string;
}
