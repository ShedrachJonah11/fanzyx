"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, VerifiedBadge } from "@/components/ui/Badge";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { subscriptions as subsApi } from "@/services/modules/subscriptions";
import { ApiError } from "@/services/apiClient";
import type { SubscriptionOut } from "@/services/dtos";
import { formatNaira } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";
const PAGE_SIZE = 30;

export default function SubscribersPage() {
  const [items, setItems] = useState<SubscriptionOut[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [notCreator, setNotCreator] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const page = await subsApi.mySubscribers({ limit: PAGE_SIZE });
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
        setInitialLoaded(true);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) {
          if (e.code === "creator_required") {
            setNotCreator(true);
          } else {
            toast.error(e.detail ?? "Couldn't load subscribers");
          }
        }
        setInitialLoaded(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);
    try {
      const page = await subsApi.mySubscribers({ cursor, limit: PAGE_SIZE });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load more");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "500px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  const activeCount = items.filter((s) => s.status === "active").length;
  const mrrKobo = useMemo(() => {
    return items.reduce((sum, s) => {
      if (s.status !== "active") return sum;
      return sum + s.priceKobo / Math.max(1, s.planMonths);
    }, 0);
  }, [items]);

  if (notCreator) {
    return (
      <DashboardShell title="Subscribers">
        <EmptyState
          title="Creator accounts only"
          body="This page is available once your creator profile is set up."
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Subscribers"
      subtitle={
        initialLoaded
          ? `${activeCount} active · ${formatNaira(mrrKobo / 100)} MRR`
          : undefined
      }
    >
      <div className="surface-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_120px_140px_140px_120px_40px] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-white/45 border-b border-white/[0.05]">
          <div>Subscriber</div>
          <div>Plan</div>
          <div>Renewal</div>
          <div>Status</div>
          <div className="text-right">Paid</div>
          <div />
        </div>

        {loading && items.length === 0 ? (
          <ul>
            {[0, 1, 2, 3].map((i) => (
              <RowSkeleton key={i} />
            ))}
          </ul>
        ) : items.length === 0 && initialLoaded ? (
          <EmptyState
            className="!bg-transparent !border-none"
            title="No subscribers yet"
            body="Share your profile to get your first fan on board."
            imageSize={180}
          />
        ) : (
          <ul>
            {items.map((s) => (
              <SubscriberRow key={s.id} sub={s} />
            ))}
          </ul>
        )}

        {loading && items.length > 0 ? (
          <div className="flex justify-center py-4">
            <span
              aria-hidden
              className="size-5 rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
            />
          </div>
        ) : null}

        <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
      </div>
    </DashboardShell>
  );
}

function SubscriberRow({ sub }: { sub: SubscriptionOut }) {
  const name = sub.creator.displayName || sub.creator.username;
  const renewsAt = new Date(sub.currentPeriodEnd);
  const renewsAtLabel = renewsAt.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <li className="grid grid-cols-1 md:grid-cols-[2fr_120px_140px_140px_120px_40px] gap-4 px-5 py-4 border-t border-white/[0.05] items-center">
      <Link
        href={`/creator/${sub.creator.username}`}
        className="flex items-center gap-3 min-w-0"
      >
        <Avatar
          name={name}
          gradient={BRAND_GRADIENT}
          image={sub.creator.avatarUrl ?? undefined}
          size={36}
        />
        <div className="min-w-0">
          <div className="text-sm text-white font-medium truncate flex items-center gap-1">
            {name}
            <VerifiedBadge active={sub.creator.verified} />
          </div>
          <div className="text-[11px] text-white/45 truncate">
            @{sub.creator.username}
          </div>
        </div>
      </Link>
      <div className="text-sm text-white/80">
        {sub.planMonths}-month
      </div>
      <div className="text-sm text-white/60">{renewsAtLabel}</div>
      <div>
        {sub.status === "active" && sub.autoRenew ? (
          <Badge variant="success">Active</Badge>
        ) : sub.status === "active" && !sub.autoRenew ? (
          <Badge>Not renewing</Badge>
        ) : sub.status === "cancelled" ? (
          <Badge>Cancelled</Badge>
        ) : sub.status === "past_due" ? (
          <Badge variant="danger">Past due</Badge>
        ) : (
          <Badge>Expired</Badge>
        )}
      </div>
      <div className="text-sm text-white/80 md:text-right">
        {formatNaira(sub.priceKobo / 100)}
      </div>
      <div />
    </li>
  );
}

function RowSkeleton() {
  return (
    <li className="grid grid-cols-1 md:grid-cols-[2fr_120px_140px_140px_120px_40px] gap-4 px-5 py-4 border-t border-white/[0.05] items-center">
      <div className="flex items-center gap-3">
        <SkeletonCircle size={36} />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-3 w-32 rounded-full" />
          <Skeleton className="h-2.5 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-3 w-16 rounded-full" />
      <Skeleton className="h-3 w-20 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-3 w-16 rounded-full ml-auto" />
      <div />
    </li>
  );
}
