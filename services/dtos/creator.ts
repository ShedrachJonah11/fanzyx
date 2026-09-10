export interface Bank {
  code: string;
  name: string;
  slug?: string;
}

export interface ResolveAccountOut {
  accountName: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
}

export interface SavePayoutAccountIn {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface SavePayoutAccountOut {
  bankCode: string;
  bankName: string | null;
  accountNumberMasked: string;
  accountName: string | null;
}

export interface OnboardingCompleteOut {
  ok: true;
  completedAt: string;
}

/* ── Subscription pricing ───────────────────────────── */

export type SubscriptionMonths = 1 | 2 | 3;

export interface SubscriptionPricingOut {
  monthlyPriceKobo: number;
  discountPct: number;
  discountExpiresAt: string | null;
  discountActive: boolean;
  /** Subset of [1, 2, 3] — durations the creator has chosen to offer.
   *  Never empty; server-side deduped and sorted. */
  availableMonths: SubscriptionMonths[];
}

export interface UpdateSubscriptionIn {
  monthlyPriceKobo: number;
  discountPct?: number;
  discountExpiresAt?: string | null;
  /** Non-empty subset of [1, 2, 3]. Omit to keep the current selection. */
  availableMonths?: SubscriptionMonths[];
}

/* Public plan list for the fan-side subscribe modal.
 * Length varies with the creator's `availableMonths` — 1..3 entries. */
export interface CreatorPlan {
  months: SubscriptionMonths;
  priceKobo: number;      // what the fan pays (already discounted)
  discountKobo: number;   // savings vs pre-discount price
  /** ISO timestamp when the discount expires — optional. Backend can add
   *  this at any time and the UI will start rendering "for N days". */
  discountExpiresAt?: string | null;
}
