import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Gift,
  Lock,
  Percent,
  Plus,
  RotateCcw,
  Sparkles,
  Wallet,
} from "lucide-react";
import type {
  WalletTxnKind,
  WalletTxnOut,
  WalletTxnStatus,
} from "@/services/dtos";
import { cn, formatNaira } from "@/lib/utils";

const KIND_LABEL: Record<WalletTxnKind, string> = {
  topup: "Top up",
  subscription: "Subscription",
  tip: "Tip",
  ppv: "PPV unlock",
  payout: "Payout",
  refund: "Refund",
  platform_fee: "Platform fee",
  bundle: "Bundle",
};

const KIND_ICON: Record<
  WalletTxnKind,
  React.ComponentType<{ className?: string }>
> = {
  topup: Plus,
  subscription: Sparkles,
  tip: Gift,
  ppv: Lock,
  payout: Wallet,
  refund: RotateCcw,
  platform_fee: Percent,
  bundle: DollarSign,
};

const STATUS_TONE: Record<WalletTxnStatus, string> = {
  completed: "text-white/50",
  pending: "text-amber-300",
  failed: "text-red-300",
  reversed: "text-white/40",
};

export function TxnRow({ txn }: { txn: WalletTxnOut }) {
  const Icon = KIND_ICON[txn.kind] ?? DollarSign;
  const isCredit = txn.direction === "credit";
  const signedNaira =
    (isCredit ? 1 : -1) * (txn.amountKobo / 100);
  const primary = txn.description || KIND_LABEL[txn.kind] || "Transaction";
  const created = new Date(txn.createdAt).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <li className="flex items-center gap-3 py-3 border-t border-white/[0.05] first:border-t-0">
      <span
        className={cn(
          "inline-flex items-center justify-center size-9 rounded-full shrink-0",
          isCredit
            ? "bg-green-500/15 text-green-300"
            : "bg-white/[0.05] text-white/75"
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/90 truncate flex items-center gap-2">
          {primary}
          {txn.status !== "completed" ? (
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wider",
                STATUS_TONE[txn.status]
              )}
            >
              · {txn.status}
            </span>
          ) : null}
        </div>
        <div className="text-[11px] text-white/50 mt-0.5 flex items-center gap-1.5">
          {isCredit ? (
            <ArrowDownLeft className="size-3 text-green-300/70" />
          ) : (
            <ArrowUpRight className="size-3 text-white/40" />
          )}
          <span>{created}</span>
        </div>
      </div>
      <span
        className={cn(
          "text-sm font-semibold shrink-0",
          isCredit ? "text-green-300" : "text-red-300"
        )}
      >
        {isCredit ? "+" : "−"}
        {formatNaira(Math.abs(signedNaira))}
      </span>
    </li>
  );
}
