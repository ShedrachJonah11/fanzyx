import { apiClient } from "../apiClient";
import { newIdempotencyKey } from "@/lib/idempotency";
import type {
  Page,
  SubscribeIn,
  SubscribeInitOut,
  SubscriptionOut,
  SubscriptionStatus,
} from "../dtos";

export const subscriptions = {
  /**
   * Fan subscribes to a creator. Wallet path returns the active subscription
   * synchronously; card path returns an `authorizationUrl` — redirect the fan
   * there. Auto-generates an idempotency key per call.
   */
  create: (dto: SubscribeIn, idempotencyKey: string = newIdempotencyKey()) =>
    apiClient.post<SubscribeInitOut>("/v1/subscriptions", dto, {
      idempotencyKey,
    }),

  /**
   * Cancels a subscription — access continues until `currentPeriodEnd`, this
   * only turns off auto-renewal. Returns the updated sub with
   * `status: "cancelled"`, `autoRenew: false`.
   */
  cancel: (id: string) =>
    apiClient.delete<SubscriptionOut>(`/v1/subscriptions/${id}`),

  /**
   * Re-enables auto-renew on a cancelled sub. Only valid while
   * `currentPeriodEnd` is still in the future — otherwise the fan must
   * subscribe fresh.
   */
  reactivate: (id: string) =>
    apiClient.post<SubscriptionOut>(`/v1/subscriptions/${id}/reactivate`),

  /** Fan's own subscriptions. Filter by status. */
  mine: (params?: {
    status?: SubscriptionStatus;
    cursor?: string;
    limit?: number;
  }) =>
    apiClient.get<Page<SubscriptionOut>>("/v1/me/subscriptions", {
      query: params,
    }),

  /** Creator's active subscribers. Creator only — 422 creator_required otherwise. */
  mySubscribers: (params?: { cursor?: string; limit?: number }) =>
    apiClient.get<Page<SubscriptionOut>>("/v1/me/subscribers", {
      query: params,
    }),
};
