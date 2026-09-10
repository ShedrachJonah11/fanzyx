"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { DollarSign, Wallet as WalletIcon } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { wallet as walletApi } from "@/services/modules/wallet";
import { payouts as payoutsApi } from "@/services/modules/payouts";
import { ApiError } from "@/services/apiClient";
import type { PayoutOut, PayoutStatus, WalletOut } from "@/services/dtos";
import { useAuth } from "@/services/context";
import { cn, formatNaira } from "@/lib/utils";

const MIN_PAYOUT_KOBO = 100_000; // ₦1,000

const STATUS_VARIANT: Record<
  PayoutStatus,
  "success" | "brand" | "danger" | "muted"
> = {
  paid: "success",
  processing: "brand",
  requested: "brand",
  failed: "danger",
  reversed: "muted",
};

export default function EarningsPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<WalletOut | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [history, setHistory] = useState<PayoutOut[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const hasPayoutAccount = !!user?.payoutAccount;

  const loadBalance = useCallback(async () => {
    try {
      const w = await walletApi.get();
      setBalance(w);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load balance");
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const page = await payoutsApi.list({ limit: 20 });
      setHistory(page.items);
    } catch (e) {
      if (e instanceof ApiError && e.code !== "creator_required") {
        toast.error(e.detail ?? "Couldn't load payouts");
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await Promise.all([loadBalance(), loadHistory()]);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadBalance, loadHistory]);

  const availableKobo = balance?.balanceKobo ?? 0;

  return (
    <DashboardShell
      title="Earnings"
      subtitle="Track your wallet balance and withdraw to your bank."
      action={
        <Button
          leftIcon={<DollarSign />}
          onClick={() => setWithdrawOpen(true)}
          disabled={availableKobo < MIN_PAYOUT_KOBO}
        >
          Withdraw
        </Button>
      }
    >
      <div className="mb-4">
        <Card className="!bg-none">
          <div className="relative overflow-hidden rounded-[16px]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(105,41,252,0.28) 0%, rgba(253,35,167,0.22) 100%)",
              }}
            />
            <div className="relative p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/70">
                  Available balance
                </span>
                <WalletIcon className="size-4 text-white/70" />
              </div>
              <div className="flex flex-col gap-1">
                {balanceLoading ? (
                  <Skeleton className="h-10 w-40 rounded-md" />
                ) : (
                  <span className="text-4xl font-semibold text-white">
                    {formatNaira(availableKobo / 100)}
                  </span>
                )}
                <span className="text-xs text-white/60">
                  {hasPayoutAccount
                    ? `Payouts go to ${user?.payoutAccount?.bankName ?? "your bank"} · ${
                        user?.payoutAccount?.accountNumberMasked ?? "•••• ••••"
                      }`
                    : "Set up a payout account to withdraw."}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="flex-1"
                  leftIcon={<DollarSign />}
                  onClick={() => setWithdrawOpen(true)}
                  disabled={availableKobo < MIN_PAYOUT_KOBO}
                >
                  Withdraw
                </Button>
                <Button
                  href="/dashboard/transactions"
                  variant="secondary"
                  className="flex-1"
                >
                  Transaction history
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent payouts</CardTitle>
        </CardHeader>
        <CardBody className="pt-0">
          {historyLoading ? (
            <ul>
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 py-3 border-t border-white/[0.05] first:border-t-0"
                >
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-40 rounded-full" />
                    <Skeleton className="h-2.5 w-28 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-3 w-20 rounded-full" />
                </li>
              ))}
            </ul>
          ) : history.length === 0 ? (
            <EmptyState
              className="!bg-transparent !border-none"
              title="No payouts yet"
              body="Withdraw your balance to your bank and it'll show up here."
              imageSize={160}
            />
          ) : (
            <ul>
              {history.map((p) => (
                <PayoutRow key={p.id} payout={p} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {withdrawOpen ? (
        <WithdrawModal
          maxKobo={availableKobo}
          onClose={() => setWithdrawOpen(false)}
          onSuccess={async () => {
            setWithdrawOpen(false);
            await Promise.all([loadBalance(), loadHistory()]);
          }}
        />
      ) : null}
    </DashboardShell>
  );
}

function PayoutRow({ payout }: { payout: PayoutOut }) {
  const requestedAt = new Date(payout.requestedAt).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const label =
    payout.status === "paid"
      ? "Paid"
      : payout.status === "processing"
      ? "Processing"
      : payout.status === "requested"
      ? "Requested"
      : payout.status === "failed"
      ? "Failed"
      : "Reversed";

  return (
    <li className="flex items-center gap-3 py-3 border-t border-white/[0.05] first:border-t-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/90">
          Payout · {formatNaira(payout.amountKobo / 100)}
        </div>
        <div className="text-[11px] text-white/50 mt-0.5">
          {requestedAt} · Fee {formatNaira(payout.feeKobo / 100)}
        </div>
        {payout.failureReason ? (
          <div className="text-[11px] text-red-300 mt-0.5">
            {payout.failureReason}
          </div>
        ) : null}
      </div>
      <Badge variant={STATUS_VARIANT[payout.status] ?? "muted"}>{label}</Badge>
      <div className="text-sm font-semibold text-white shrink-0 text-right w-24">
        {formatNaira(payout.netKobo / 100)}
      </div>
    </li>
  );
}

function WithdrawModal({
  maxKobo,
  onClose,
  onSuccess,
}: {
  maxKobo: number;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}) {
  const { user } = useAuth();
  const [amountNaira, setAmountNaira] = useState<string>(
    String(Math.floor(maxKobo / 100))
  );
  const [submitting, setSubmitting] = useState(false);
  const hasPayoutAccount = !!user?.payoutAccount;

  const amountKobo = Math.round((Number(amountNaira) || 0) * 100);
  const validAmount =
    amountKobo >= MIN_PAYOUT_KOBO && amountKobo <= maxKobo;

  const submit = async () => {
    if (!validAmount || submitting) return;
    setSubmitting(true);
    try {
      await payoutsApi.request(amountKobo);
      toast.success("Payout requested — you'll be notified when it lands");
      await onSuccess();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "onboarding_incomplete"
            ? "Finish creator onboarding to withdraw."
            : e.code === "no_payout_method"
            ? "Add a payout account first."
            : e.code === "insufficient_funds"
            ? "You don't have enough in your wallet."
            : e.code === "amount_too_small"
            ? "Amount too small after fees. Try a larger withdrawal."
            : e.code === "creator_required"
            ? "Creator accounts only."
            : e.detail ?? e.message
          : "Couldn't request payout";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={submitting ? () => {} : onClose}
      title="Withdraw to bank"
      size="md"
    >
      <div className="flex flex-col gap-5">
        {!hasPayoutAccount ? (
          <div className="rounded-[12px] p-4 bg-red-500/10 border border-red-500/30 text-sm text-red-200">
            You need to add a payout account before withdrawing.{" "}
            <Link
              href="/dashboard/settings"
              className="underline underline-offset-4 hover:text-white"
              onClick={onClose}
            >
              Set up now →
            </Link>
          </div>
        ) : (
          <div className="rounded-[12px] p-3 bg-white/[0.03] hairline text-xs text-white/60">
            Payouts go to{" "}
            <span className="text-white font-medium">
              {user?.payoutAccount?.bankName ?? "your bank"}
            </span>{" "}
            · {user?.payoutAccount?.accountNumberMasked ?? "•••• ••••"}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/70">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
              ₦
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_PAYOUT_KOBO / 100}
              max={Math.floor(maxKobo / 100)}
              value={amountNaira}
              onChange={(e) => setAmountNaira(e.target.value)}
              className={cn(
                "w-full h-12 rounded-[12px] bg-white/[0.04] hairline text-[15px] text-white pl-8 pr-4 outline-none focus:border-white/25",
                !validAmount && amountNaira && "border-red-400/40"
              )}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/45">
            <span>Min {formatNaira(MIN_PAYOUT_KOBO / 100)}</span>
            <button
              type="button"
              onClick={() => setAmountNaira(String(Math.floor(maxKobo / 100)))}
              className="text-[#FD5CC9] hover:text-white"
            >
              Withdraw all ({formatNaira(maxKobo / 100)})
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-white/60 rounded-[12px] bg-white/[0.03] hairline p-3">
          <span>Sending to your bank</span>
          <span className="text-white font-semibold">
            {formatNaira(amountKobo / 100)}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!validAmount || !hasPayoutAccount || submitting}
          >
            {submitting ? "Requesting…" : "Request payout"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
