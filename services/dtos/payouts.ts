export type PayoutStatus =
  | "requested"
  | "processing"
  | "paid"
  | "failed"
  | "reversed";

export interface PayoutOut {
  id: string;
  amountKobo: number;
  feeKobo: number;
  /** amountKobo − feeKobo — the amount actually sent to the bank. */
  netKobo: number;
  status: PayoutStatus;
  requestedAt: string;
  paidAt: string | null;
  failureReason: string | null;
}
