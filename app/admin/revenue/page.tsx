"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { admin } from "@/services/modules/admin";
import { ApiError } from "@/services/apiClient";
import type {
  PlatformFeeOut,
  PlatformFeeSource,
  PlatformSummaryOut,
} from "@/services/dtos";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const SOURCE_OPTIONS: { value: PlatformFeeSource | "all"; label: string }[] = [
  { value: "all", label: "All sources" },
  { value: "subscription", label: "Subscriptions" },
  { value: "tip", label: "Tips" },
  { value: "ppv", label: "PPV unlocks" },
];

function formatNaira(kobo: number | null | undefined) {
  const n = Math.round((kobo ?? 0) / 100);
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export default function AdminRevenuePage() {
  const [summary, setSummary] = useState<PlatformSummaryOut | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [source, setSource] = useState<PlatformFeeSource | "all">("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const [rows, setRows] = useState<PlatformFeeOut[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await admin.platformSummary();
        if (!cancelled) setSummary(s);
      } catch (e) {
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load");
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await admin.platformRevenue({
        sourceKind: source === "all" ? undefined : source,
        from: from || undefined,
        to: to || undefined,
        limit: 30,
      });
      setRows(page.items);
      setCursor(page.nextCursor);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load");
    } finally {
      setLoading(false);
    }
  }, [source, from, to]);

  useEffect(() => {
    // Refetch on filter change — legitimate data-fetching effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await admin.platformRevenue({
        sourceKind: source === "all" ? undefined : source,
        from: from || undefined,
        to: to || undefined,
        cursor,
        limit: 30,
      });
      setRows((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, source, from, to]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor || loadingMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore();
    });
    io.observe(node);
    return () => io.disconnect();
  }, [rows.length, cursor, loadingMore, loadMore]);

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div>
        <h1 className="text-[22px] font-bold text-white">Platform revenue</h1>
        <p className="text-sm text-white/60 mt-1">
          {summary?.periodLabel ?? "All-time totals + fee ledger."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          loading={summaryLoading}
          label="Total revenue"
          value={summary ? formatNaira(summary.totalRevenueKobo) : "—"}
          highlight
        />
        <SummaryCard
          loading={summaryLoading}
          label="Subscriptions"
          value={summary ? formatNaira(summary.subscriptionKobo) : "—"}
        />
        <SummaryCard
          loading={summaryLoading}
          label="Tips"
          value={summary ? formatNaira(summary.tipsKobo) : "—"}
        />
        <SummaryCard
          loading={summaryLoading}
          label="PPV"
          value={summary ? formatNaira(summary.ppvKobo) : "—"}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <label className="flex flex-col gap-1.5 flex-1">
          <span className="text-[12px] font-medium text-white/70">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white px-3 outline-none focus:border-white/25 focus:bg-white/[0.06]"
          />
        </label>
        <label className="flex flex-col gap-1.5 flex-1">
          <span className="text-[12px] font-medium text-white/70">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white px-3 outline-none focus:border-white/25 focus:bg-white/[0.06]"
          />
        </label>
        <label className="flex flex-col gap-1.5 flex-1">
          <span className="text-[12px] font-medium text-white/70">Source</span>
          <select
            value={source}
            onChange={(e) =>
              setSource(e.target.value as PlatformFeeSource | "all")
            }
            className="h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white px-3 outline-none focus:border-white/25 focus:bg-white/[0.06] appearance-none"
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#1a1a24]">
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-[14px] hairline bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-4 flex flex-col gap-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 rounded-[10px]" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/50">
            No fees in this range.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-white/45">
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Fan</th>
                <th className="px-4 py-3 font-medium text-right">Gross</th>
                <th className="px-4 py-3 font-medium text-right">Fee</th>
                <th className="px-4 py-3 font-medium text-right">Net</th>
                <th className="px-4 py-3 font-medium text-right">At</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-white/[0.05] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-white/70 bg-white/[0.06] px-2 py-0.5 rounded-full">
                      {r.sourceKind}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/85 truncate">
                    @{r.creatorUsername}
                  </td>
                  <td className="px-4 py-3 text-white/60 hidden sm:table-cell truncate">
                    {r.fanUsername ? `@${r.fanUsername}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-white/85 tabular-nums">
                    {formatNaira(r.grossKobo)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#FD5CC9] font-medium tabular-nums">
                    {formatNaira(r.feeKobo)}
                  </td>
                  <td className="px-4 py-3 text-right text-white/70 tabular-nums">
                    {formatNaira(r.netKobo)}
                  </td>
                  <td className="px-4 py-3 text-right text-[11px] text-white/45 tabular-nums whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {cursor ? <div ref={sentinelRef} className="h-1" /> : null}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  loading,
  highlight,
}: {
  label: string;
  value: string;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] p-5 hairline",
        highlight ? "bg-gradient-brand-soft" : "bg-white/[0.03]"
      )}
    >
      <div className="text-[11px] uppercase tracking-wider text-white/60 font-medium">
        {label}
      </div>
      <div
        className={cn(
          "text-[24px] font-bold tabular-nums mt-2 text-white",
          loading && "text-white/50"
        )}
      >
        {loading ? "…" : value}
      </div>
    </div>
  );
}
