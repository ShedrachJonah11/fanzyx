import imageCompression from "browser-image-compression";
import { apiClient } from "../apiClient";
import type {
  UploadCompleteOut,
  UploadInitIn,
  UploadInitOut,
  UploadKind,
} from "../dtos";

export const uploads = {
  init: (dto: UploadInitIn) =>
    apiClient.post<UploadInitOut>("/v1/uploads", dto),
  complete: (mediaId: string) =>
    apiClient.post<UploadCompleteOut>(`/v1/uploads/${mediaId}/complete`),
};

/**
 * Client-side image compression before upload.
 * - Skips non-images and GIFs (to preserve animations).
 * - Caps at ~2 MB / 2560px longest side / quality 0.85.
 * - Runs in a Web Worker so it doesn't block the UI.
 * - Falls back to the original file if compression fails.
 */
async function maybeCompress(file: File, kind: UploadKind): Promise<File> {
  const isImageKind = kind === "image" || kind === "avatar" || kind === "cover";
  if (!isImageKind) return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 2560,
      useWebWorker: true,
      initialQuality: 0.85,
      fileType: file.type,
    });
    // If compression somehow made it bigger, prefer the original.
    return compressed.size < file.size ? compressed : file;
  } catch (e) {
    console.warn("Image compression failed, uploading original", e);
    return file;
  }
}

export interface UploadResult {
  mediaId: string;
  publicUrl: string;
}

export type UploadProgress = (loaded: number, total: number) => void;

/**
 * PUT the file to the signed URL via XHR so we can report upload progress
 * (fetch doesn't support upload progress in most browsers).
 */
function putWithProgress(
  url: string,
  headers: Record<string, string>,
  body: Blob,
  onProgress?: UploadProgress
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    if (onProgress) {
      xhr.upload.addEventListener("progress", (ev) => {
        if (ev.lengthComputable) onProgress(ev.loaded, ev.total);
      });
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(body);
  });
}

/**
 * Full two-phase upload for a single file. Returns { mediaId, publicUrl }.
 * - Use `publicUrl` for PATCH /v1/me (avatar / cover).
 * - Use `mediaId` when creating posts (POST /v1/posts { mediaIds: [...] }).
 *
 * Pass `onProgress` to render a per-file progress bar in the caller.
 */
export async function uploadFile(
  file: File,
  kind: UploadKind,
  onProgress?: UploadProgress
): Promise<UploadResult> {
  const prepared = await maybeCompress(file, kind);

  const init = await uploads.init({
    filename: prepared.name,
    contentType: prepared.type,
    sizeBytes: prepared.size,
    kind,
  });

  await putWithProgress(init.uploadUrl, init.headers, prepared, onProgress);

  const done = await uploads.complete(init.mediaId);
  return {
    mediaId: init.mediaId,
    publicUrl: done.publicUrl ?? init.publicUrl,
  };
}

/**
 * Convenience wrapper for avatar/cover — returns the publicUrl directly since
 * callers only need it for PATCH /v1/me { avatarUrl | coverUrl }.
 */
export const uploadImage = async (
  file: File,
  kind: "avatar" | "cover"
): Promise<string> => {
  const { publicUrl } = await uploadFile(file, kind);
  return publicUrl;
};
