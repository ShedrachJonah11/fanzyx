import type { CreatorMini } from "./posts";
import type { SubscriptionMonths } from "./creator";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "past_due"
  | "expired";

export type SubscribeSource = "wallet" | "card";

export interface SubscriptionOut {
  id: string;
  creator: CreatorMini;
  planMonths: SubscriptionMonths;
  /** What the fan paid — snapshot at purchase, not the current listed price. */
  priceKobo: number;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  createdAt: string;
}

export interface SubscribeIn {
  creatorUsername: string;
  /** Must be in the creator's `availableMonths` from `GET /v1/creators/{u}/plans`. */
  planMonths: SubscriptionMonths;
  source: SubscribeSource;
}

/**
 * Response from `POST /v1/subscriptions`.
 *
 * - `source: "wallet"` → `subscription` is populated with `status: "active"`.
 * - `source: "card"` → `authorizationUrl` is present; redirect the user there.
 *   Fan returns to your callbackUrl; poll `subscriptions.mine()` to confirm.
 */
export interface SubscribeInitOut {
  subscription?: SubscriptionOut;
  authorizationUrl?: string;
  reference?: string;
}
