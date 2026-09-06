"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Download, Search } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { cn, formatNaira } from "@/lib/utils";

type Tx = {
  id: string;
  date: string;
  description: string;
  type: "topup" | "subscription" | "tip" | "ppv" | "refund";
  amount: number;
  status: "completed" | "pending" | "failed";
};

const TXS: Tx[] = [
  { id: "t1", date: "Today · 09:14", description: "Top up · Bank transfer", type: "topup", amount: 10000, status: "completed" },
  { id: "t2", date: "Today · 08:02", description: "Subscribed to @zarabello", type: "subscription", amount: -3500, status: "completed" },
  { id: "t3", date: "Yesterday · 20:02", description: "Tipped @ijeoma", type: "tip", amount: -2000, status: "completed" },
  { id: "t4", date: "Yesterday · 12:41", description: "PPV unlock · Sample pack", type: "ppv", amount: -3500, status: "completed" },
  { id: "t5", date: "2 days ago", description: "Top up · Card •••• 4821", type: "topup", amount: 15000, status: "completed" },
  { id: "t6", date: "3 days ago", description: "Subscribed to @bolabeats", type: "subscription", amount: -5000, status: "completed" },
  { id: "t7", date: "5 days ago", description: "Refund · @deji cancellation", type: "refund", amount: 3000, status: "completed" },
  { id: "t8", date: "1 week ago", description: "Top up · USSD", type: "topup", amount: 5000, status: "pending" },
  { id: "t9", date: "1 week ago", description: "Tipped @femilaughs", type: "tip", amount: -1500, status: "completed" },
  { id: "t10", date: "2 weeks ago", description: "Subscribed to @tundeplays", type: "subscription", amount: -4000, status: "failed" },
];

const TABS = [
  { value: "all", label: "All" },
  { value: "in", label: "Incoming" },
  { value: "out", label: "Outgoing" },
];

export default function TransactionsPage() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    let arr = TXS;
    if (tab === "in") arr = arr.filter((t) => t.amount > 0);
    else if (tab === "out") arr = arr.filter((t) => t.amount < 0);
    if (q.trim())
      arr = arr.filter((t) => t.description.toLowerCase().includes(q.toLowerCase()));
    return arr;
  }, [tab, q]);

  const incoming = TXS.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const outgoing = TXS.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <DashboardShell
      variant="fan"
      title="Transactions"
      subtitle="A history of your top-ups, subscriptions, tips, and refunds."
      action={
        <Button variant="secondary" leftIcon={<Download />}>
          Export CSV
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <StatCard label="Incoming" value={formatNaira(incoming)} delta={`${TXS.filter((t) => t.amount > 0).length} transactions`} />
        <StatCard label="Outgoing" value={formatNaira(outgoing)} delta={`${TXS.filter((t) => t.amount < 0).length} transactions`} positive={false} />
        <StatCard label="Net" value={formatNaira(incoming - outgoing)} delta="This period" />
      </div>

      <div className="flex items-center justify-between gap-3 flex-col sm:flex-row mb-4">
        <Tabs items={TABS} value={tab} onValueChange={setTab} />
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search transactions"
            className="w-full h-10 rounded-[10px] bg-white/[0.04] hairline text-sm text-white placeholder:text-white/40 pl-10 pr-4 outline-none focus:border-white/20 focus:bg-white/[0.06]"
          />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[140px_1fr_120px_140px_100px] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-white/45 border-b border-white/[0.05]">
          <div>Date</div>
          <div>Description</div>
          <div>Type</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Status</div>
        </div>
        <ul>
          {list.length === 0 ? (
            <li className="p-10 text-center text-white/55">No transactions match your filters.</li>
          ) : (
            list.map((t) => (
              <li
                key={t.id}
                className="grid grid-cols-1 md:grid-cols-[140px_1fr_120px_140px_100px] gap-2 md:gap-4 px-5 py-4 border-t border-white/[0.05] items-center"
              >
                <div className="text-xs text-white/55">{t.date}</div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center size-8 rounded-full shrink-0",
                      t.amount > 0
                        ? "bg-green-500/15 text-green-300"
                        : "bg-white/[0.05] text-white/75"
                    )}
                  >
                    {t.amount > 0 ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </span>
                  <div className="text-sm text-white/90 truncate">{t.description}</div>
                </div>
                <div>
                  <TypeBadge type={t.type} />
                </div>
                <div className="md:text-right font-medium">
                  <span className={t.amount < 0 ? "text-red-300" : "text-green-300"}>
                    {t.amount < 0 ? "" : "+"}
                    {formatNaira(t.amount)}
                  </span>
                </div>
                <div className="md:text-right">
                  <StatusPill status={t.status} />
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </DashboardShell>
  );
}

function TypeBadge({ type }: { type: Tx["type"] }) {
  const map: Record<
    Tx["type"],
    { label: string; variant: "brand" | "warning" | "success" | "muted" | "danger" }
  > = {
    topup: { label: "Top up", variant: "success" },
    subscription: { label: "Subscription", variant: "brand" },
    tip: { label: "Tip", variant: "warning" },
    ppv: { label: "PPV", variant: "muted" },
    refund: { label: "Refund", variant: "success" },
  };
  const entry = map[type];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

function StatusPill({ status }: { status: Tx["status"] }) {
  const map = {
    completed: { label: "Completed", cls: "text-green-300" },
    pending: { label: "Pending", cls: "text-amber-300" },
    failed: { label: "Failed", cls: "text-red-300" },
  };
  const entry = map[status];
  return <span className={cn("text-xs font-medium", entry.cls)}>{entry.label}</span>;
}
