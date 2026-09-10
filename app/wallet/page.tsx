"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Plus,
  ShieldCheck,
  Wallet as WalletIcon,
} from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { wallet as walletApi } from "@/services/modules/wallet";
import { ApiError } from "@/services/apiClient";
import type { WalletOut, WalletTxnOut } from "@/services/dtos";
import { cn, formatNaira } from "@/lib/utils";
import { TxnRow } from "@/components/wallet/TxnRow";

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];
const MIN_TOPUP_KOBO = 10_000; // ₦100

export default function WalletPage() {
  return (
    <Suspense fallback={null}>
      <WalletPageInner />
    </Suspense>
  );
}

function WalletPageInner() {
  const params = useSearchParams();
  const [balance, setBalance] = useState<WalletOut | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [recent, setRecent] = useState<WalletTxnOut[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amountNaira, setAmountNaira] = useState<string>("5000");
  const [submitting, setSubmitting] = useState(false);
  const [pollingPayment, setPollingPayment] = useState(false);

  const loadBalance = useCallback(async () => {
    try {
      const w = await walletApi.get();
      setBalance(w);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load wallet");
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const loadRecent = useCallback(async () => {
    try {
      const page = await walletApi.transactions({ limit: 5 });
      setRecent(page.items);
    } catch {
      // Silent — the transactions view surfaces its own errors.
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await Promise.all([loadBalance(), loadRecent()]);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadBalance, loadRecent]);

  // Post-payment polling — fan returns from Nomba with ?reference=<ref>.
  // Poll wallet.get() every 2s for up to 30s to catch the webhook-driven
  // credit; toast the outcome.
  useEffect(() => {
    const reference = params.get("reference");
    if (!reference) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- polling lifecycle is inherently an effect
    setPollingPayment(true);

    const initialBalance = balance?.balanceKobo ?? null;
    const started = Date.now();
    const DEADLINE = 30_000;
    const INTERVAL = 2_000;

    const tick = async () => {
      if (cancelled) return;
      try {
        const w = await walletApi.get();
        if (cancelled) return;
        setBalance(w);
        if (initialBalance !== null && w.balanceKobo > initialBalance) {
          const delta = w.balanceKobo - initialBalance;
          toast.success(`Wallet credited ${formatNaira(delta / 100)}`);
          setPollingPayment(false);
          await loadRecent();
          return;
        }
      } catch {
        // ignore transient errors, try again
      }
      if (Date.now() - started > DEADLINE) {
        setPollingPayment(false);
        toast.info(
          "Payment is processing — we'll update your balance shortly."
        );
        return;
      }
      setTimeout(tick, INTERVAL);
    };
    tick();

    return () => {
      cancelled = true;
    };
    // We intentionally only key this on `reference` — polling should fire
    // exactly once per return-from-payment, not every time balance updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const amountKobo = Math.round((Number(amountNaira) || 0) * 100);
  const canTopUp = amountKobo >= MIN_TOPUP_KOBO && !submitting;

  const submitTopUp = async () => {
    if (!canTopUp) return;
    setSubmitting(true);
    try {
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/wallet`
          : undefined;
      const res = await walletApi.topup({ amountKobo, callbackUrl });
      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
        return;
      }
      // No auth URL means backend accepted the top-up without a checkout step
      // (dev sandbox / direct credit). Refresh balance.
      toast.success("Top-up initiated");
      setTopUpOpen(false);
      await Promise.all([loadBalance(), loadRecent()]);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "rate_limited"
            ? "Too many attempts. Try again in a moment."
            : e.detail ?? e.message
          : "Couldn't start top-up";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pending = balance?.pendingKobo ?? 0;

  return (
    <DashboardShell
      variant="fan"
      title="Wallet"
      subtitle="Fund your wallet to subscribe, tip, and unlock exclusive content."
      action={
        <Button leftIcon={<Plus />} onClick={() => setTopUpOpen(true)}>
          Add funds
        </Button>
      }
    >
      {/* Balance card */}
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
                  Wallet balance
                </span>
                <WalletIcon className="size-4 text-white/70" />
              </div>
              <div className="flex flex-col gap-1">
                {balanceLoading ? (
                  <Skeleton className="h-10 w-40 rounded-md" />
                ) : (
                  <span className="text-4xl font-semibold text-white">
                    {formatNaira((balance?.balanceKobo ?? 0) / 100)}
                  </span>
                )}
                <span className="text-xs text-white/60">
                  {pollingPayment
                    ? "Confirming your payment…"
                    : pending > 0
                    ? `${formatNaira(pending / 100)} pending clearance`
                    : "All funds available"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  className="flex-1"
                  leftIcon={<Plus />}
                  onClick={() => setTopUpOpen(true)}
                >
                  Add funds
                </Button>
                <Button
                  href="/transactions"
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

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <Link
            href="/transactions"
            className="text-xs text-white/70 hover:text-white inline-flex items-center gap-1"
          >
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardBody className="pt-0">
          {recentLoading ? (
            <ul>
              {[0, 1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 py-3 border-t border-white/[0.05] first:border-t-0"
                >
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-40 rounded-full" />
                    <Skeleton className="h-2.5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-16 rounded-full" />
                </li>
              ))}
            </ul>
          ) : recent.length === 0 ? (
            <EmptyState
              className="!bg-transparent !border-none"
              title="No activity yet"
              body="Fund your wallet to start subscribing and tipping."
              imageSize={140}
            />
          ) : (
            <ul>
              {recent.map((t) => (
                <TxnRow key={t.id} txn={t} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Add funds modal */}
      <Modal
        open={topUpOpen}
        onClose={submitting ? () => {} : () => setTopUpOpen(false)}
        title="Add funds"
        size="md"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/70">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
                ₦
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={100}
                value={amountNaira}
                onChange={(e) => setAmountNaira(e.target.value)}
                className="w-full h-12 rounded-[12px] bg-white/[0.04] hairline text-[15px] text-white pl-8 pr-4 outline-none focus:border-white/25"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmountNaira(String(v))}
                  className={cn(
                    "h-8 px-3 rounded-full text-xs border transition-colors",
                    Number(amountNaira) === v
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.04] text-white/75 border-white/10 hover:bg-white/[0.08]"
                  )}
                >
                  {formatNaira(v, { compact: true })}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-white/45">
              Minimum {formatNaira(MIN_TOPUP_KOBO / 100)}.
            </span>
          </div>

          <div className="rounded-[12px] p-3 bg-white/[0.03] hairline flex items-start gap-2 text-[11px] text-white/60">
            <ShieldCheck className="size-3.5 text-white/70 shrink-0 mt-px" />
            Payments are processed securely by Nomba. You&apos;ll be redirected
            to their checkout to complete the payment.
          </div>

          <div className="flex items-center justify-between text-xs text-white/60 rounded-[12px] bg-white/[0.03] hairline p-3">
            <span>You&apos;ll pay</span>
            <span className="text-white font-semibold">
              {formatNaira(amountKobo / 100)}
            </span>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!canTopUp}
            onClick={submitTopUp}
          >
            {submitting ? "Redirecting…" : "Continue to payment"}
          </Button>
        </div>
      </Modal>
    </DashboardShell>
  );
}
