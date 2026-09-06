"use client";

import { useState } from "react";
import { Calendar, Megaphone, MoreHorizontal, Plus, Users } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { formatCompact, formatNaira } from "@/lib/utils";

const campaigns = [
  {
    id: "c1",
    name: "Free week for new subscribers",
    status: "live" as const,
    audience: "Non-subscribers",
    reach: 12400,
    conversions: 84,
    revenue: 420000,
    ends: "Ends in 6 days",
  },
  {
    id: "c2",
    name: "20% off first month",
    status: "live" as const,
    audience: "Explore viewers",
    reach: 6200,
    conversions: 41,
    revenue: 205000,
    ends: "Ends in 12 days",
  },
  {
    id: "c3",
    name: "Loyalty gift for 6+ month subs",
    status: "draft" as const,
    audience: "Long-term subscribers",
    reach: 0,
    conversions: 0,
    revenue: 0,
    ends: "Not launched",
  },
  {
    id: "c4",
    name: "December re-engagement",
    status: "ended" as const,
    audience: "Cancelled subs",
    reach: 1820,
    conversions: 22,
    revenue: 110000,
    ends: "Ended 3 weeks ago",
  },
];

export default function CampaignsPage() {
  const [tab, setTab] = useState("all");

  const filtered = campaigns.filter((c) => {
    if (tab === "all") return true;
    if (tab === "live") return c.status === "live";
    if (tab === "drafts") return c.status === "draft";
    if (tab === "ended") return c.status === "ended";
    return true;
  });

  return (
    <DashboardShell
      title="Campaigns"
      subtitle="Promotions, discounts, and re-engagement offers for your audience."
      action={
        <Button leftIcon={<Plus />}>New campaign</Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <StatCard label="Live" value="2" delta="Active now" />
        <StatCard label="Reach" value={formatCompact(18600)} delta="+14%" />
        <StatCard label="Conversions" value="125" delta="+22" />
        <StatCard label="Revenue" value={formatNaira(625000)} delta="+₦86k" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <Tabs
          items={[
            { value: "all", label: "All", count: campaigns.length },
            { value: "live", label: "Live", count: campaigns.filter((c) => c.status === "live").length },
            { value: "drafts", label: "Drafts", count: campaigns.filter((c) => c.status === "draft").length },
            { value: "ended", label: "Ended", count: campaigns.filter((c) => c.status === "ended").length },
          ]}
          value={tab}
          onValueChange={setTab}
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="surface-card p-5 flex items-center gap-4 flex-col sm:flex-row"
          >
            <span className="inline-flex items-center justify-center size-11 rounded-[12px] bg-gradient-brand-soft border border-white/10 text-white/85 shrink-0">
              <Megaphone className="size-5" />
            </span>
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[15px] font-semibold text-white">{c.name}</span>
                {c.status === "live" ? (
                  <Badge variant="success">Live</Badge>
                ) : c.status === "draft" ? (
                  <Badge variant="muted">Draft</Badge>
                ) : (
                  <Badge variant="warning">Ended</Badge>
                )}
              </div>
              <div className="mt-1 text-xs text-white/55 flex items-center gap-4 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3" /> {c.audience}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" /> {c.ends}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6 sm:gap-8 shrink-0">
              <MiniMetric label="Reach" value={formatCompact(c.reach)} />
              <MiniMetric label="Conv." value={String(c.conversions)} />
              <MiniMetric
                label="Revenue"
                value={c.revenue > 0 ? formatNaira(c.revenue, { compact: true }) : "—"}
                highlight
              />
              <button className="inline-flex items-center justify-center size-8 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06]">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <div className="surface-card p-10 text-center text-white/55">
            No campaigns in this view.
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}

function MiniMetric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-[10px] uppercase text-white/45 tracking-wider">{label}</span>
      <span className={highlight ? "text-sm font-semibold text-green-300" : "text-sm font-medium text-white"}>
        {value}
      </span>
    </div>
  );
}
