"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { VerifiedBadge } from "@/components/ui/Badge";
import { creatorPlans } from "@/services/modules/creator";
import { ApiError } from "@/services/apiClient";
import type { CreatorPlan } from "@/services/dtos";
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
  onPlanSelect?: (plan: CreatorPlan) => void;
};

export function SubscriptionModal({ open, onClose, target, onPlanSelect }: Props) {
  const [plans, setPlans] = useState<CreatorPlan[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<number | null>(null);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

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

  if (!open) return null;

  const displayName = target.displayName || target.username;
  const availablePlans = (plans ?? []).filter((p) => (p.priceKobo ?? 0) > 0);
  const noPricing = !loading && availablePlans.length === 0;
  const singlePlan =
    !loading && availablePlans.length === 1 ? availablePlans[0] : null;

  const choose = async (plan: CreatorPlan) => {
    if (selecting !== null) return;
    setSelecting(plan.months);
    try {
      if (onPlanSelect) {
        await onPlanSelect(plan);
      } else {
        toast.info(
          `${plan.months}-month plan · ${formatNaira(plan.priceKobo / 100)} — checkout coming soon.`
        );
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === "plan_not_offered") {
        toast.error("This plan is no longer available. Refreshing…");
        await loadPlans();
      } else if (e instanceof ApiError) {
        toast.error(e.detail ?? e.message);
      }
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
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
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="on-media absolute top-3 right-3 inline-flex items-center justify-center size-9 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/70 transition-colors"
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

          {/* Benefits */}
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

          {/* Plans */}
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
              <SinglePlanButton
                plan={singlePlan}
                busy={selecting === singlePlan.months}
                onSelect={() => choose(singlePlan)}
              />
            ) : (
              availablePlans.map((p) => (
                <PlanRow
                  key={p.months}
                  plan={p}
                  busy={selecting === p.months}
                  disabled={selecting !== null && selecting !== p.months}
                  onSelect={() => choose(p)}
                />
              ))
            )}
          </div>

          <p className="mt-4 text-[11px] text-white/40 text-center">
            You can cancel anytime from your subscriptions.
          </p>
        </div>
      </div>
    </div>
  );
}

function SinglePlanButton({
  plan,
  busy,
  onSelect,
}: {
  plan: CreatorPlan;
  busy: boolean;
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
      disabled={busy}
      className={cn(
        "on-media flex items-center justify-between gap-3 w-full h-14 pl-5 pr-5 rounded-full text-white font-bold uppercase text-[13px] tracking-[0.06em] bg-gradient-brand shadow-[0_10px_30px_-8px_rgba(253,35,167,0.55)] hover:opacity-95 transition-opacity disabled:opacity-60",
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
        <span className="text-[16px]">
          {busy ? "…" : formatNaira(priceNaira)}
        </span>
      </span>
    </button>
  );
}

function PlanRow({
  plan,
  busy,
  disabled,
  onSelect,
}: {
  plan: CreatorPlan;
  busy: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const priceNaira = plan.priceKobo / 100;
  const originalNaira = (plan.priceKobo + plan.discountKobo) / 100;
  const hasDiscount = plan.discountKobo > 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled || busy}
      className={cn(
        "flex items-center justify-between gap-3 w-full h-14 pl-4 pr-4 rounded-[14px] hairline bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed",
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
          {busy ? "…" : formatNaira(priceNaira)}
        </span>
      </span>
    </button>
  );
}
