"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Coins,
  DollarSign,
  Heart,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { admin } from "@/services/modules/admin";
import type { AdminDashboardOut } from "@/services/dtos";
import { ApiError } from "@/services/apiClient";
import { cn } from "@/lib/utils";

function formatNaira(kobo: number | null | undefined) {
  const n = Math.round((kobo ?? 0) / 100);
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function formatCount(n: number | null | undefined) {
  return (n ?? 0).toLocaleString("en-NG");
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await admin.dashboard();
        if (!cancelled) setData(res);
      } catch (e) {
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div>
        <h1 className="text-[22px] font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/60 mt-1">
          {data?.periodLabel ?? "Platform snapshot"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          loading={loading}
          label="Total users"
          value={data ? formatCount(data.totalUsers) : "—"}
          icon={<Users className="size-4" />}
        />
        <Kpi
          loading={loading}
          label="Active creators"
          value={data ? formatCount(data.activeCreators) : "—"}
          icon={<UserRound className="size-4" />}
        />
        <Kpi
          loading={loading}
          label="Active subscriptions"
          value={data ? formatCount(data.activeSubscriptions) : "—"}
          icon={<Heart className="size-4" />}
        />
        <Kpi
          loading={loading}
          label="Revenue"
          value={data ? formatNaira(data.revenueKobo) : "—"}
          icon={<Coins className="size-4" />}
          highlight
        />
        <Kpi
          loading={loading}
          label="Tips"
          value={data ? formatNaira(data.tipsKobo) : "—"}
          icon={<DollarSign className="size-4" />}
        />
        <Kpi
          loading={loading}
          label="Payouts pending"
          value={data ? formatCount(data.payoutsPending) : "—"}
          icon={<Wallet className="size-4" />}
        />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  loading,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] p-5 hairline flex flex-col gap-3",
        highlight ? "bg-gradient-brand-soft" : "bg-white/[0.03]"
      )}
    >
      <div className="flex items-center justify-between text-white/60">
        <span className="text-[12px] font-medium tracking-wide uppercase">
          {label}
        </span>
        <span className="inline-flex items-center justify-center size-8 rounded-full bg-white/[0.06]">
          {icon}
        </span>
      </div>
      <div
        className={cn(
          "text-[26px] font-bold tabular-nums text-white",
          loading && "text-white/50"
        )}
      >
        {loading ? "…" : value}
      </div>
    </div>
  );
}
