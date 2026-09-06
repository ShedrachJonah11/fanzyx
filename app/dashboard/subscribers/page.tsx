"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { subscribers } from "@/lib/mock-data";
import { formatNaira, timeAgo } from "@/lib/utils";

export default function SubscribersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "cancelled" | "past_due">("all");

  const list = useMemo(() => {
    let arr = subscribers;
    if (status !== "all") arr = arr.filter((s) => s.status === status);
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter((x) => x.name.toLowerCase().includes(s) || x.username.toLowerCase().includes(s));
    }
    return arr;
  }, [q, status]);

  const active = subscribers.filter((s) => s.status === "active").length;
  const mrr = subscribers.filter((s) => s.status === "active").reduce((sum, s) => sum + s.planPrice, 0);
  const newThisMonth = 42; // mocked
  const churn = 3.2;

  return (
    <DashboardShell
      title="Subscribers"
      subtitle="See who's supporting you and manage plans."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Total subscribers" value={String(subscribers.length)} delta={`${active} active`} />
        <StatCard label="New this month" value={String(newThisMonth)} delta="+18.4%" />
        <StatCard label="Churn" value={`${churn}%`} delta="-0.4%" />
        <StatCard label="MRR" value={formatNaira(mrr)} delta="+9.1%" />
      </div>

      <div className="flex items-center justify-between gap-3 flex-col sm:flex-row mb-4">
        <div className="flex items-center gap-2 p-1 rounded-full bg-white/[0.04] hairline">
          {(["all", "active", "cancelled", "past_due"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setStatus(v)}
              className={
                "h-8 px-3.5 rounded-full text-[13px] font-medium " +
                (v === status ? "bg-gradient-brand text-white" : "text-white/60 hover:text-white/90")
              }
            >
              {v === "all" ? "All" : v === "past_due" ? "Past due" : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subscribers"
            className="w-full h-10 rounded-[10px] bg-white/[0.04] hairline text-sm text-white placeholder:text-white/40 pl-10 pr-4 outline-none focus:border-white/20 focus:bg-white/[0.06]"
          />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_120px_120px_120px_120px_120px_40px] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-white/45 border-b border-white/[0.05]">
          <div>Subscriber</div>
          <div>Plan</div>
          <div>Joined</div>
          <div>Renewal</div>
          <div>Status</div>
          <div className="text-right">Total spent</div>
          <div />
        </div>
        <ul>
          {list.map((s) => (
            <li
              key={s.id}
              className="grid grid-cols-1 md:grid-cols-[2fr_120px_120px_120px_120px_120px_40px] gap-4 px-5 py-4 border-t border-white/[0.05] items-center"
            >
              <div className="flex items-center gap-3">
                <Avatar name={s.name} gradient={s.avatarGradient} size={36} />
                <div className="min-w-0">
                  <div className="text-sm text-white font-medium truncate">{s.name}</div>
                  <div className="text-[11px] text-white/45 truncate">@{s.username}</div>
                </div>
              </div>
              <div className="text-sm text-white/80">{s.plan}</div>
              <div className="text-sm text-white/60">{timeAgo(s.joined)} ago</div>
              <div className="text-sm text-white/60">in {timeAgo(s.renewalDate)}</div>
              <div>
                {s.status === "active" ? (
                  <Badge variant="success">Active</Badge>
                ) : s.status === "cancelled" ? (
                  <Badge variant="muted">Cancelled</Badge>
                ) : (
                  <Badge variant="danger">Past due</Badge>
                )}
              </div>
              <div className="text-sm text-white/80 md:text-right">{formatNaira(s.totalSpent)}</div>
              <div className="justify-self-end">
                <button className="inline-flex items-center justify-center size-8 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06]">
                  <MoreHorizontal className="size-4" />
                </button>
              </div>
            </li>
          ))}
          {list.length === 0 ? (
            <li className="p-10 text-center text-white/55">No subscribers match your filters.</li>
          ) : null}
        </ul>
      </div>
    </DashboardShell>
  );
}
