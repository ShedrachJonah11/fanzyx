"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge, VerifiedBadge } from "@/components/ui/Badge";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { subscriptions as subsApi } from "@/services/modules/subscriptions";
import { ApiError } from "@/services/apiClient";
import type { SubscriptionOut, SubscriptionStatus } from "@/services/dtos";
import { cn, formatNaira } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

type Tab = "active" | "cancelled";

const TABS: { value: Tab; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "cancelled", label: "Cancelled" },
];

type TabState = {
  items: SubscriptionOut[];
  loading: boolean;
  loaded: boolean;
};

const emptyTab = (): TabState => ({ items: [], loading: false, loaded: false });

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [cache, setCache] = useState<Record<Tab, TabState>>({
    active: emptyTab(),
    cancelled: emptyTab(),
  });
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (t: Tab) => {
    setCache((c) => ({ ...c, [t]: { ...c[t], loading: true } }));
    try {
      const status: SubscriptionStatus = t === "active" ? "active" : "cancelled";
      const page = await subsApi.mine({ status, limit: 30 });
      setCache((c) => ({
        ...c,
        [t]: { items: page.items, loading: false, loaded: true },
      }));
    } catch (e) {
      if (e instanceof ApiError)
        toast.error(e.detail ?? "Couldn't load subscriptions");
      setCache((c) => ({ ...c, [t]: { ...c[t], loading: false, loaded: true } }));
    }
  }, []);

  useEffect(() => {
    if (cache[tab].loaded) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load(tab);
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, cache, load]);

  const current = cache[tab];

  const activeCount = cache.active.items.length;
  const activeMonthly = useMemo(() => {
    return cache.active.items.reduce((sum, s) => {
      // Snapshot priceKobo covers `planMonths` months — derive per-month.
      const perMonth = s.priceKobo / Math.max(1, s.planMonths);
      return sum + perMonth;
    }, 0);
  }, [cache.active.items]);

  const doCancel = async (sub: SubscriptionOut) => {
    if (busyId) return;
    setBusyId(sub.id);
    try {
      const updated = await subsApi.cancel(sub.id);
      setCache((c) => ({
        ...c,
        active: {
          ...c.active,
          items: c.active.items.map((s) => (s.id === updated.id ? updated : s)),
        },
      }));
      toast.success("Auto-renew turned off");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "not_owner"
            ? "You can't cancel this subscription."
            : e.detail ?? e.message
          : "Couldn't cancel";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const doReactivate = async (sub: SubscriptionOut) => {
    if (busyId) return;
    setBusyId(sub.id);
    try {
      const updated = await subsApi.reactivate(sub.id);
      setCache((c) => ({
        ...c,
        active: {
          ...c.active,
          items: c.active.items.map((s) => (s.id === updated.id ? updated : s)),
        },
      }));
      toast.success("Auto-renew turned back on");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "already_expired"
            ? "This plan has ended — subscribe again to restart."
            : e.detail ?? e.message
          : "Couldn't reactivate";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardShell
      variant="fan"
      title="Your subscriptions"
      subtitle={
        cache.active.loaded
          ? `${activeCount} active · ${formatNaira(activeMonthly / 100)}/month`
          : undefined
      }
    >
      <FeedTabs
        items={TABS}
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        className="mb-6"
      />

      {current.loading && current.items.length === 0 ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <SubSkeleton key={i} />
          ))}
        </div>
      ) : current.items.length === 0 && current.loaded ? (
        <SubsEmpty tab={tab} />
      ) : (
        <div className="flex flex-col gap-4">
          {current.items.map((s) => (
            <SubCard
              key={s.id}
              sub={s}
              busy={busyId === s.id}
              onCancel={() => doCancel(s)}
              onReactivate={() => doReactivate(s)}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function SubCard({
  sub,
  busy,
  onCancel,
  onReactivate,
}: {
  sub: SubscriptionOut;
  busy: boolean;
  onCancel: () => void;
  onReactivate: () => void;
}) {
  const name = sub.creator.displayName || sub.creator.username;
  const renewsAt = new Date(sub.currentPeriodEnd);
  const renewsAtLabel = renewsAt.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  // eslint-disable-next-line react-hooks/purity -- comparing a static ISO date to now is safe
  const isExpired = renewsAt.getTime() < Date.now();
  const isActive = sub.status === "active";
  const isCancelled = sub.status === "cancelled";
  const perMonth = sub.priceKobo / Math.max(1, sub.planMonths);

  return (
    <div className="surface-card p-4 sm:p-5 flex items-center gap-4 flex-col sm:flex-row">
      <Link
        href={`/creator/${sub.creator.username}`}
        className="shrink-0"
        aria-label={`View ${name}'s profile`}
      >
        <Avatar
          name={name}
          gradient={BRAND_GRADIENT}
          image={sub.creator.avatarUrl ?? undefined}
          size={64}
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col gap-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-1.5">
          <Link
            href={`/creator/${sub.creator.username}`}
            className="text-[15px] font-semibold text-white truncate hover:underline underline-offset-2"
          >
            {name}
          </Link>
          {sub.creator.verified ? <VerifiedBadge /> : null}
          {isActive && !sub.autoRenew ? (
            <Badge>Cancelled</Badge>
          ) : isCancelled ? (
            <Badge>Cancelled</Badge>
          ) : sub.status === "past_due" ? (
            <Badge>Past due</Badge>
          ) : null}
        </div>
        <div className="text-xs text-white/55">
          @{sub.creator.username} ·{" "}
          {sub.planMonths}-month plan · {formatNaira(perMonth / 100)}/mo
        </div>
        <div className="text-xs text-white/45">
          {isCancelled || !sub.autoRenew
            ? isExpired
              ? `Ended ${renewsAtLabel}`
              : `Access ends ${renewsAtLabel}`
            : `Renews ${renewsAtLabel}`}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isActive && sub.autoRenew ? (
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {busy ? "Cancelling…" : "Cancel"}
          </Button>
        ) : isActive && !sub.autoRenew ? (
          <Button onClick={onReactivate} disabled={busy}>
            {busy ? "Reactivating…" : "Reactivate"}
          </Button>
        ) : isCancelled && isExpired ? (
          <Button href={`/creator/${sub.creator.username}#subscribe`}>
            Subscribe again
          </Button>
        ) : isCancelled ? (
          <Button onClick={onReactivate} disabled={busy}>
            {busy ? "Reactivating…" : "Reactivate"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function SubSkeleton() {
  return (
    <div className="surface-card p-4 sm:p-5 flex items-center gap-4">
      <SkeletonCircle size={64} />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-40 rounded-full" />
        <Skeleton className="h-3 w-56 rounded-full" />
        <Skeleton className="h-3 w-32 rounded-full" />
      </div>
      <Skeleton className="h-10 w-24 rounded-full" />
    </div>
  );
}

function SubsEmpty({ tab }: { tab: Tab }) {
  return (
    <EmptyState
      title={
        tab === "active"
          ? "No active subscriptions"
          : "No cancelled subscriptions"
      }
      body={
        tab === "active"
          ? "Subscribe to a creator to see them here."
          : "Anything you cancel will show up here."
      }
      action={
        tab === "active" ? (
          <Button href="/feed">Explore creators</Button>
        ) : null
      }
    />
  );
}
