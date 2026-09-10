import { apiClient } from "../apiClient";
import { newIdempotencyKey } from "@/lib/idempotency";
import type {
  Ok,
  Page,
  TipCreateIn,
  TopupIn,
  TopupInitOut,
  WalletOut,
  WalletTxnKind,
  WalletTxnOut,
} from "../dtos";

export const wallet = {
  get: () => apiClient.get<WalletOut>("/v1/wallet"),

  /**
   * Initiate a wallet top-up via Nomba checkout. Client should redirect the
   * user to the returned `authorizationUrl` and poll `wallet.get()` on return.
   * Auto-generates an idempotency key per call.
   */
  topup: (dto: TopupIn, idempotencyKey: string = newIdempotencyKey()) =>
    apiClient.post<TopupInitOut>("/v1/wallet/topup", dto, { idempotencyKey }),

  transactions: (params?: {
    kind?: WalletTxnKind;
    cursor?: string;
    limit?: number;
  }) =>
    apiClient.get<Page<WalletTxnOut>>("/v1/wallet/transactions", {
      query: params,
    }),

  /**
   * Send a tip. Auto-generates a fresh Idempotency-Key per call so a
   * retry after a network blip doesn't double-charge. Callers who want
   * to retry the SAME click should pass their own key.
   */
  tip: (dto: TipCreateIn, idempotencyKey: string = newIdempotencyKey()) =>
    apiClient.post<Ok>("/v1/wallet/tips", dto, { idempotencyKey }),
};
