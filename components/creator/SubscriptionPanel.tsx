"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import { creatorPlans } from "@/services/modules/creator";
import { ApiError } from "@/services/apiClient";
import type { CreatorPlan } from "@/services/dtos";
import type { Creator } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Props = {
  creator: Creator;
  onSubscribe: () => void;
  /** "full" shows Subscribe Now + Bundles.  "bundles" shows only the bundles section. */
  variant?: "full" | "bundles";
  /** When true, "no pricing" renders a "Set your pricing" CTA linking to the
   *  settings page. When false (default), the whole panel is hidden. */
  isSelf?: boolean;
};

const NGN_WHOLE = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});
const NGN_DECIMAL = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatNgn(kobo: number): string {
  const naira = kobo / 100;
  return Number.isInteger(naira) ? NGN_WHOLE.format(naira) : NGN_DECIMAL.format(naira);
}

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

const MONTH_LABELS: Record<number, string> = {
  1: "1-month Subscription Plan",
  2: "2-month Subscription Plan",
  3: "3-month Subscription Plan",
};

export function SubscriptionPanel({
  creator,
  onSubscribe,
  variant = "full",
  isSelf = false,
}: Props) {
  const [bundlesOpen, setBundlesOpen] = useState(true);
  const [plans, setPlans] = useState<CreatorPlan[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const list = await creatorPlans.byUsername(creator.username);
        if (cancelled) return;
        setPlans(list);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) {
          setPlans([]);
        } else {
          setPlans([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [creator.username]);

  // Backend now returns only durations the creator has opted to offer, so
  // an empty or all-zero response means "no pricing set".
  const validPlans = (plans ?? []).filter((p) => (p.priceKobo ?? 0) > 0);
  const noPricing = !loading && validPlans.length === 0;

  // Fan side + creator hasn't enabled subscriptions → hide the whole panel.
  if (noPricing && !isSelf) return null;

  // Owner side + no pricing → show a "Set your pricing" prompt.
  if (noPricing && isSelf) {
    return (
      <div className="surface-card p-5 flex items-start gap-3">
        <span className="inline-flex items-center justify-center size-10 rounded-full bg-gradient-brand text-white shrink-0">
          <Wallet className="size-4" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-[15px]">
            Set your subscription pricing
          </h3>
          <p className="text-white/60 text-[13px] mt-0.5">
            Fans can&apos;t subscribe until you set a monthly price for your
            content.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-3 inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[12px] font-bold text-white on-media bg-gradient-brand hover:opacity-95 transition-opacity"
          >
            Set pricing →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* SUBSCRIBE NOW (hidden in bundles-only variant, or for self) */}
      {variant === "full" && !isSelf ? (
        <div>
          <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-white/60 mb-3">
            Subscribe now
          </h3>
          <button
            onClick={onSubscribe}
            disabled={loading}
            className="on-media w-full h-12 rounded-full bg-[#FD23A7] hover:bg-[#E31E97] text-white font-bold uppercase text-[13px] tracking-[0.08em] flex items-center justify-between px-6 transition-colors shadow-[0_8px_24px_-8px_rgba(253,35,167,0.55)] disabled:opacity-60"
          >
            <span>Subscribe</span>
            <span>Now</span>
          </button>
        </div>
      ) : null}

      {/* SUBSCRIPTION IN BUNDLES */}
      <div>
        <button
          type="button"
          onClick={() => setBundlesOpen((v) => !v)}
          aria-expanded={bundlesOpen}
          className="w-full flex items-center justify-between mb-3 group"
        >
          <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-white/60 group-hover:text-white/80 transition-colors">
            {isSelf ? "Your subscription bundles" : "Subscription in bundles"}
          </h3>
          <ChevronDown
            className={cn(
              "size-4 text-white/50 group-hover:text-white/80 transition-transform",
              bundlesOpen && "rotate-180"
            )}
          />
        </button>

        {bundlesOpen ? (
          loading ? (
            <BundleSkeleton />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {validPlans.map((plan) => {
                const hasDiscount = plan.discountKobo > 0;
                const originalKobo = plan.priceKobo + plan.discountKobo;
                const pctOff = hasDiscount
                  ? Math.round((plan.discountKobo / originalKobo) * 100)
                  : 0;
                const days = daysUntil(plan.discountExpiresAt);

                return (
                  <li key={plan.months}>
                    <button
                      onClick={isSelf ? undefined : onSubscribe}
                      disabled={isSelf}
                      className={cn(
                        "w-full h-11 rounded-full border font-bold uppercase text-[11px] tracking-[0.10em] flex items-center justify-between px-5 transition-colors gap-3",
                        isSelf
                          ? "border-white/10 bg-white/[0.03] text-white/85 cursor-default"
                          : "border-[#FD23A7]/45 bg-[#FD23A7]/[0.08] hover:bg-[#FD23A7]/[0.16] hover:border-[#FD23A7]/70 text-[#FD23A7]"
                      )}
                    >
                      <span className="truncate">
                        {MONTH_LABELS[plan.months] ?? `${plan.months}-Months`}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        {hasDiscount ? (
                          <span className="text-white/40 text-[10px] line-through normal-case">
                            {formatNgn(originalKobo)}
                          </span>
                        ) : null}
                        <span>{formatNgn(plan.priceKobo)}</span>
                        {hasDiscount ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FD23A7]/25 text-[#FD5CC9]">
                            {pctOff}% off{days !== null ? ` · ${days}d` : ""}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}

        {isSelf && !loading ? (
          <Link
            href="/dashboard/settings"
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/60 hover:text-white"
          >
            Manage pricing →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function BundleSkeleton() {
  return (
    <ul className="flex flex-col gap-2.5">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="h-11 rounded-full bg-white/[0.04] hairline animate-pulse"
        />
      ))}
    </ul>
  );
}
