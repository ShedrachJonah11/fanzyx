"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { TxnRow } from "@/components/wallet/TxnRow";
import { wallet as walletApi } from "@/services/modules/wallet";
import { ApiError } from "@/services/apiClient";
import type { WalletTxnKind, WalletTxnOut } from "@/services/dtos";
import { cn } from "@/lib/utils";

type Filter = "all" | WalletTxnKind;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "topup", label: "Top-ups" },
  { value: "subscription", label: "Subscriptions" },
  { value: "tip", label: "Tips" },
  { value: "ppv", label: "PPV" },
  { value: "bundle", label: "Bundles" },
  { value: "payout", label: "Payouts" },
  { value: "refund", label: "Refunds" },
  { value: "platform_fee", label: "Fees" },
];

const PAGE_SIZE = 20;

/**
 * Shared transactions ledger — renders inside whichever DashboardShell the
 * caller mounts (fan `/transactions` or creator `/dashboard/transactions`).
 * Filter chips + cursor infinite scroll.
 */
export function TransactionsView() {
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<WalletTxnOut[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      setItems([]);
      setCursor(null);
      setHasMore(true);
      setInitialLoaded(false);
      try {
        const page = await walletApi.transactions({
          kind: filter === "all" ? undefined : filter,
          limit: PAGE_SIZE,
        });
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
        setInitialLoaded(true);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError)
          toast.error(e.detail ?? "Couldn't load transactions");
        setInitialLoaded(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);
    try {
      const page = await walletApi.transactions({
        kind: filter === "all" ? undefined : filter,
        cursor,
        limit: PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (e) {
      if (e instanceof ApiError)
        toast.error(e.detail ?? "Couldn't load more");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, filter]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => {
          const active = f.value === filter;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center h-8 px-3.5 rounded-full text-[12px] font-medium transition-colors shrink-0",
                active
                  ? "bg-gradient-brand text-white on-media"
                  : "bg-white/[0.04] hairline text-white/70 hover:bg-white/[0.08]"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
        </CardHeader>
        <CardBody className="pt-0">
          {loading && items.length === 0 ? (
            <ul>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 py-3 border-t border-white/[0.05] first:border-t-0"
                >
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-48 rounded-full" />
                    <Skeleton className="h-2.5 w-28 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-16 rounded-full" />
                </li>
              ))}
            </ul>
          ) : items.length === 0 && initialLoaded ? (
            <EmptyState
              className="!bg-transparent !border-none"
              title={
                filter === "all"
                  ? "No transactions yet"
                  : `No ${filter} transactions`
              }
              body="Anything you top up, spend, tip or receive shows up here."
              imageSize={160}
            />
          ) : (
            <ul>
              {items.map((t) => (
                <TxnRow key={t.id} txn={t} />
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

          {!hasMore && items.length > 0 ? (
            <div className="py-4 text-center text-[11px] text-white/40">
              End of ledger.
            </div>
          ) : null}

          <div ref={sentinelRef} aria-hidden className="h-1 w-full" />
        </CardBody>
      </Card>
    </>
  );
}
