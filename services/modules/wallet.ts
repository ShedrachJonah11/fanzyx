import { apiClient } from "../apiClient";
import { newIdempotencyKey } from "@/lib/idempotency";
import type { Ok, TipCreateIn, WalletOut } from "../dtos";

export const wallet = {
  get: () => apiClient.get<WalletOut>("/v1/wallet"),

  /**
   * Send a tip. Auto-generates a fresh Idempotency-Key per call so a
   * retry after a network blip doesn't double-charge. Callers who want
   * to retry the SAME click should pass their own key.
   */
  tip: (dto: TipCreateIn, idempotencyKey: string = newIdempotencyKey()) =>
    apiClient.post<Ok>("/v1/wallet/tips", dto, { idempotencyKey }),
};
