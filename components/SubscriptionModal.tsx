"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, CreditCard, Wallet as WalletIcon, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { VerifiedBadge } from "@/components/ui/Badge";
import { creatorPlans } from "@/services/modules/creator";
import { subscriptions as subsApi } from "@/services/modules/subscriptions";
import { wallet as walletApi } from "@/services/modules/wallet";
import { useAuth } from "@/services/context";
import { ApiError } from "@/services/apiClient";
import type {
  CreatorPlan,
  SubscribeSource,
  WalletOut,
} from "@/services/dtos";
import { cn, formatNaira } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";
const COVER_GRADIENT =
  "linear-gradient(135deg, #4C1D95 0%, #831843 60%, #0F172A 100%)";

export type SubscribeTarget = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl?: string | null;
  verified?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  target: SubscribeTarget;
  /** Optional — invoked after successful wallet-path subscribe. Card path
   *  redirects to Nomba and this never fires. */
  onSuccess?: () => void;
};

export function SubscriptionModal({ open, onClose, target, onSuccess }: Props) {
  const [plans, setPlans] = useState<CreatorPlan[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CreatorPlan | null>(null);
  const [wallet, setWallet] = useState<WalletOut | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [submitting, setSubmitting] = useState<SubscribeSource | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const list = await creatorPlans.byUsername(target.username);
      setPlans(list);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load plans");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [target.username]);

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const w = await walletApi.get();
      setWallet(w);
    } catch {
      // silent — payment picker still lets you use card
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedPlan) setSelectedPlan(null);
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, selectedPlan]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await loadPlans();
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loadPlans]);

  // Fetch wallet when we advance to the picker step.
  useEffect(() => {
    if (!selectedPlan) return;
    loadWallet();
  }, [selectedPlan, loadWallet]);

  if (!open) return null;

  const displayName = target.displayName || target.username;
  const availablePlans = (plans ?? []).filter((p) => (p.priceKobo ?? 0) > 0);
  const noPricing = !loading && availablePlans.length === 0;
  const singlePlan =
    !loading && availablePlans.length === 1 ? availablePlans[0] : null;

  const pickPlan = (plan: CreatorPlan) => setSelectedPlan(plan);

  const submitSubscribe = async (source: SubscribeSource) => {
    if (!selectedPlan || submitting) return;
    setSubmitting(source);
    try {
      const res = await subsApi.create({
        creatorUsername: target.username,
        planMonths: selectedPlan.months,
        source,
      });

      // Card path — redirect to Nomba checkout.
      if (source === "card" && res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
        return;
      }
      // Wallet path — active subscription in response.
      if (source === "wallet" && res.subscription) {
        toast.success(`Subscribed to @${target.username}`);
        onSuccess?.();
        onClose();
        return;
      }
      // Unexpected shape — best-effort success signal.
      toast.success("Subscription initiated");
      onSuccess?.();
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "insufficient_funds") {
          const shortfallKobo = Math.max(
            0,
            selectedPlan.priceKobo - (wallet?.balanceKobo ?? 0)
          );
          toast.error(
            `Not enough in wallet. Top up ${formatNaira(shortfallKobo / 100)} to subscribe.`
          );
        } else if (e.code === "plan_not_offered") {
          toast.error("This plan is no longer offered. Refreshing…");
          setSelectedPlan(null);
          await loadPlans();
        } else if (e.code === "no_pricing") {
          toast.error("This creator hasn't published pricing yet.");
          setSelectedPlan(null);
          await loadPlans();
        } else if (e.code === "self_subscribe") {
          toast.error("You can't subscribe to yourself.");
        } else if (e.code === "creator_not_found") {
          toast.error("Creator not found.");
        } else {
          toast.error(e.detail ?? e.message);
        }
      } else {
        toast.error("Couldn't complete subscription");
      }
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-label={`Subscribe to ${displayName}`}
        className="relative w-full max-w-md rounded-[20px] overflow-hidden surface-card flex flex-col max-h-[92dvh]"
      >
        {/* Cover hero */}
        <div className="relative h-40 sm:h-48 shrink-0">
          {target.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={target.coverUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ backgroundImage: COVER_GRADIENT }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[var(--surface)]" />
          {selectedPlan ? (
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              disabled={!!submitting}
              aria-label="Back"
              className="on-media absolute top-3 left-3 inline-flex items-center justify-center size-9 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/70 transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            disabled={!!submitting}
            aria-label="Close"
            className="on-media absolute top-3 right-3 inline-flex items-center justify-center size-9 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/70 transition-colors disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 -mt-8">
          {/* Creator identity */}
          <div className="flex items-center gap-3">
            <Avatar
              name={displayName}
              gradient={BRAND_GRADIENT}
              image={target.avatarUrl ?? undefined}
              size={64}
              ring
              className="ring-4 ring-[var(--surface)] shrink-0"
            />
            <div className="min-w-0 flex-1 pt-6">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[17px] font-semibold text-white truncate">
                  {displayName}
                </span>
                {target.verified ? <VerifiedBadge /> : null}
              </div>
              <span className="text-[13px] text-white/55 truncate block">
                @{target.username}
              </span>
            </div>
          </div>

          {selectedPlan ? (
            <CheckoutStep
              plan={selectedPlan}
              wallet={wallet}
              walletLoading={walletLoading}
              submitting={submitting}
              onPay={submitSubscribe}
            />
          ) : (
            <PickPlanStep
              displayName={displayName}
              loading={loading}
              plans={plans}
              noPricing={noPricing}
              singlePlan={singlePlan}
              availablePlans={availablePlans}
              onPick={pickPlan}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PickPlanStep({
  displayName,
  loading,
  plans,
  noPricing,
  singlePlan,
  availablePlans,
  onPick,
}: {
  displayName: string;
  loading: boolean;
  plans: CreatorPlan[] | null;
  noPricing: boolean;
  singlePlan: CreatorPlan | null;
  availablePlans: CreatorPlan[];
  onPick: (p: CreatorPlan) => void;
}) {
  return (
    <>
      <h3 className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
        Subscribe and get these benefits
      </h3>
      <div className="mt-1 h-px bg-white/[0.06]" />
      <ul className="mt-3 flex flex-col gap-2.5">
        {[
          `Full access to ${displayName}'s content`,
          `Direct message with ${displayName}`,
          "Cancel your subscription at any time",
        ].map((b) => (
          <li key={b} className="flex items-center gap-3 text-[14px] text-white/85">
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-gradient-brand shrink-0">
              <Check className="size-3 text-white" strokeWidth={3} />
            </span>
            {b}
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
        Select subscription bundle
      </h3>
      <div className="mt-1 h-px bg-white/[0.06]" />

      <div className="mt-3 flex flex-col gap-2.5">
        {loading || !plans ? (
          <>
            <Skeleton className="h-14 w-full rounded-[14px]" />
            <Skeleton className="h-14 w-full rounded-[14px]" />
            <Skeleton className="h-14 w-full rounded-[14px]" />
          </>
        ) : noPricing ? (
          <p className="text-sm text-white/55 py-3">
            This creator hasn&apos;t enabled subscriptions yet.
          </p>
        ) : singlePlan ? (
          <SinglePlanButton plan={singlePlan} onSelect={() => onPick(singlePlan)} />
        ) : (
          availablePlans.map((p) => (
            <PlanRow key={p.months} plan={p} onSelect={() => onPick(p)} />
          ))
        )}
      </div>

      <p className="mt-4 text-[11px] text-white/40 text-center">
        You can cancel anytime from your subscriptions.
      </p>
    </>
  );
}

function CheckoutStep({
  plan,
  wallet,
  walletLoading,
  submitting,
  onPay,
}: {
  plan: CreatorPlan;
  wallet: WalletOut | null;
  walletLoading: boolean;
  submitting: SubscribeSource | null;
  onPay: (source: SubscribeSource) => void;
}) {
  const { user } = useAuth();
  const topUpHref =
    user?.role === "creator" ? "/dashboard/earnings" : "/wallet";
  const priceNaira = plan.priceKobo / 100;
  const originalNaira = (plan.priceKobo + plan.discountKobo) / 100;
  const hasDiscount = plan.discountKobo > 0;
  const balanceKobo = wallet?.balanceKobo ?? 0;
  const walletCovers = balanceKobo >= plan.priceKobo;
  const shortfallKobo = Math.max(0, plan.priceKobo - balanceKobo);
  const anyBusy = submitting !== null;

  return (
    <>
      <div className="mt-6 rounded-[14px] hairline bg-white/[0.03] p-4">
        <div className="flex items-center justify-between text-[12px] uppercase tracking-wider text-white/55">
          <span>
            {plan.months === 1 ? "1-month plan" : `${plan.months}-month plan`}
          </span>
          <span>You pay</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="text-white/70 text-sm">
            {hasDiscount ? (
              <>
                <span className="line-through text-white/40">
                  {formatNaira(originalNaira)}
                </span>{" "}
                <span className="text-[#FD5CC9] font-semibold">
                  {formatNaira(plan.discountKobo / 100)} off
                </span>
              </>
            ) : (
              "One-time charge"
            )}
          </span>
          <span className="text-white font-bold text-lg">
            {formatNaira(priceNaira)}
          </span>
        </div>
      </div>

      <h3 className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
        Payment method
      </h3>
      <div className="mt-1 h-px bg-white/[0.06]" />

      <div className="mt-3 flex flex-col gap-2.5">
        {/* Wallet */}
        <button
          type="button"
          onClick={() => onPay("wallet")}
          disabled={anyBusy || walletLoading || !walletCovers}
          className={cn(
            "flex items-center gap-3 w-full p-4 rounded-[14px] hairline transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed",
            walletCovers
              ? "bg-white/[0.03] hover:bg-white/[0.06]"
              : "bg-white/[0.02]"
          )}
        >
          <span className="inline-flex items-center justify-center size-10 rounded-full bg-gradient-brand text-white shrink-0">
            <WalletIcon className="size-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-white">
              Pay with wallet
            </div>
            <div className="text-[12px] text-white/55 mt-0.5">
              {walletLoading
                ? "Loading balance…"
                : `Balance: ${formatNaira(balanceKobo / 100)}`}
            </div>
          </div>
          <span className="text-[12px] font-semibold text-white shrink-0">
            {submitting === "wallet" ? (
              <span
                aria-hidden
                className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block"
              />
            ) : walletCovers ? (
              "Pay →"
            ) : (
              "Insufficient"
            )}
          </span>
        </button>

        {!walletCovers && !walletLoading ? (
          <Link
            href={topUpHref}
            className="text-[12px] text-[#FD5CC9] hover:text-white underline underline-offset-4 self-start"
          >
            Top up {formatNaira(shortfallKobo / 100)} →
          </Link>
        ) : null}

        {/* Card */}
        <button
          type="button"
          onClick={() => onPay("card")}
          disabled={anyBusy}
          className="flex items-center gap-3 w-full p-4 rounded-[14px] hairline bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left disabled:opacity-60"
        >
          <span className="inline-flex items-center justify-center size-10 rounded-full bg-white/[0.06] text-white shrink-0">
            <CreditCard className="size-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-white">
              Pay with card
            </div>
            <div className="text-[12px] text-white/55 mt-0.5">
              Secure checkout via Nomba
            </div>
          </div>
          <span className="text-[12px] font-semibold text-white shrink-0">
            {submitting === "card" ? (
              <span
                aria-hidden
                className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block"
              />
            ) : (
              "Pay →"
            )}
          </span>
        </button>
      </div>

      <p className="mt-4 text-[11px] text-white/40 text-center">
        You can cancel anytime from your subscriptions.
      </p>
    </>
  );
}

function SinglePlanButton({
  plan,
  onSelect,
}: {
  plan: CreatorPlan;
  onSelect: () => void;
}) {
  const priceNaira = plan.priceKobo / 100;
  const originalNaira = (plan.priceKobo + plan.discountKobo) / 100;
  const hasDiscount = plan.discountKobo > 0;
  const label = plan.months === 1 ? "1 month" : `${plan.months} months`;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "on-media flex items-center justify-between gap-3 w-full h-14 pl-5 pr-5 rounded-full text-white font-bold uppercase text-[13px] tracking-[0.06em] bg-gradient-brand shadow-[0_10px_30px_-8px_rgba(253,35,167,0.55)] hover:opacity-95 transition-opacity",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      )}
    >
      <span>Subscribe · {label}</span>
      <span className="flex items-baseline gap-2 shrink-0 normal-case">
        {hasDiscount ? (
          <span className="text-[11px] text-white/70 line-through">
            {formatNaira(originalNaira)}
          </span>
        ) : null}
        <span className="text-[16px]">{formatNaira(priceNaira)}</span>
      </span>
    </button>
  );
}

function PlanRow({
  plan,
  onSelect,
}: {
  plan: CreatorPlan;
  onSelect: () => void;
}) {
  const priceNaira = plan.priceKobo / 100;
  const originalNaira = (plan.priceKobo + plan.discountKobo) / 100;
  const hasDiscount = plan.discountKobo > 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between gap-3 w-full h-14 pl-4 pr-4 rounded-[14px] hairline bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-violet)]"
      )}
    >
      <span className="text-[13px] font-bold uppercase tracking-wider text-[#FD23A7]">
        {plan.months}-month subscription plan
      </span>
      <span className="flex items-baseline gap-2 shrink-0">
        {hasDiscount ? (
          <span className="text-[11px] text-white/40 line-through">
            {formatNaira(originalNaira)}
          </span>
        ) : null}
        <span className="text-[15px] font-bold text-white">
          {formatNaira(priceNaira)}
        </span>
      </span>
    </button>
  );
}
