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
