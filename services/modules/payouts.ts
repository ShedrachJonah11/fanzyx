import { apiClient } from "../apiClient";
import { newIdempotencyKey } from "@/lib/idempotency";
import type { Page, PayoutOut, PayoutStatus } from "../dtos";

export const payouts = {
  /**
   * Creator requests a withdrawal — debits the creator's wallet and initiates
   * a bank transfer via Nomba. Async: response is `status: "requested"`, the
   * webhook flips it to `processing` → `paid`/`failed` later. Failed transfers
   * auto-refund the wallet, so no client rollback needed.
   */
  request: (amountKobo: number, idempotencyKey: string = newIdempotencyKey()) =>
    apiClient.post<PayoutOut>(
      "/v1/payouts",
      { amountKobo },
      { idempotencyKey }
    ),

  list: (params?: {
    status?: PayoutStatus;
    cursor?: string;
    limit?: number;
  }) => apiClient.get<Page<PayoutOut>>("/v1/payouts", { query: params }),
};
