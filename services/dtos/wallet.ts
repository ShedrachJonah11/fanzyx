export interface WalletOut {
  balanceKobo: number;
  pendingKobo?: number;
  currency: "NGN";
}

export interface TipCreateIn {
  creatorUsername: string;
  amountKobo: number; // 10_000 to 100_000_000
  postId?: string;
  message?: string;
}

/* ── Top-up ─────────────────────────────────────────── */

export interface TopupIn {
  amountKobo: number; // min 10_000 (₦100)
  callbackUrl?: string;
}

export interface TopupInitOut {
  reference: string;
  authorizationUrl: string | null;
}

/* ── Transaction ledger ─────────────────────────────── */

export type WalletTxnKind =
  | "topup"
  | "subscription"
  | "tip"
  | "ppv"
  | "payout"
  | "refund"
  | "platform_fee"
  | "bundle";

export type WalletTxnDirection = "credit" | "debit";

export type WalletTxnStatus = "pending" | "completed" | "failed" | "reversed";

export interface WalletTxnOut {
  id: string;
  kind: WalletTxnKind;
  direction: WalletTxnDirection;
  amountKobo: number;
  balanceAfterKobo: number;
  reference: string;
  status: WalletTxnStatus;
  description: string | null;
  createdAt: string;
}
