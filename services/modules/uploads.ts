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
 * Full two-phase upload for a single file. Returns the final publicUrl to
 * save via PATCH /v1/me.
 */
export async function uploadFile(file: File, kind: UploadKind): Promise<string> {
  const init = await uploads.init({
    filename: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    kind,
  });

  const put = await fetch(init.uploadUrl, {
    method: "PUT",
    headers: init.headers,
    body: file,
  });
  if (!put.ok) throw new Error(`Upload failed: ${put.status} ${put.statusText}`);

  const done = await uploads.complete(init.mediaId);
  return done.publicUrl ?? init.publicUrl;
}

export const uploadImage = (file: File, kind: "avatar" | "cover") =>
  uploadFile(file, kind);
