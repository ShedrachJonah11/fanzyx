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

export interface SubscriptionPricingOut {
  monthlyPriceKobo: number;
  discountPct: number;
  discountExpiresAt: string | null;
  discountActive: boolean;
}

export interface UpdateSubscriptionIn {
  monthlyPriceKobo: number;
  discountPct?: number;
  discountExpiresAt?: string | null;
}

/* Public plan list for the fan-side subscribe modal.
 * Always 3 entries — one per {1, 2, 3} months. */
export interface CreatorPlan {
  months: 1 | 2 | 3;
  priceKobo: number;      // what the fan pays
  discountKobo: number;   // savings vs pre-discount price
}
