import { DashboardShell } from "@/components/shell/DashboardShell";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EarningsChart } from "@/components/EarningsChart";
import { StatCard } from "@/components/ui/StatCard";
import { earningsSeries, subscriberSeries } from "@/lib/mock-data";
import { formatCompact, formatNaira } from "@/lib/utils";

export default function AnalyticsPage() {
  return (
    <DashboardShell
      title="Analytics"
      subtitle="Understand how your channel is growing."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <StatCard label="Impressions" value={formatCompact(184920)} delta="+18.4%" />
        <StatCard label="Profile visits" value={formatCompact(12480)} delta="+9.2%" />
        <StatCard label="Conversion" value="3.8%" delta="+0.6%" />
        <StatCard label="Avg. session" value="4m 20s" delta="+11s" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Earnings</CardTitle>
            <span className="text-xs text-white/60">{formatNaira(2989500)} total</span>
          </CardHeader>
          <CardBody className="pt-0">
            <EarningsChart data={earningsSeries} height={220} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Subscribers</CardTitle>
            <span className="text-xs text-white/60">1,284 total</span>
          </CardHeader>
          <CardBody className="pt-0">
            <EarningsChart
              data={subscriberSeries}
              height={220}
              color="#22D3EE"
              accent="#6929FC"
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top posts</CardTitle>
          </CardHeader>
          <CardBody className="pt-0 flex flex-col gap-3">
            {[
              { title: "Studio session vibes with the band", views: 14200 },
              { title: "New sample pack for producers", views: 9200 },
              { title: "Q&A with fans", views: 7800 },
              { title: "Behind the scenes: mixing", views: 6100 },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-sm text-white/85 truncate">{p.title}</span>
                <span className="text-xs text-white/55 shrink-0">
                  {formatCompact(p.views)}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audience by age</CardTitle>
          </CardHeader>
          <CardBody className="pt-0 flex flex-col gap-2.5">
            {[
              { label: "18–24", pct: 32 },
              { label: "25–34", pct: 41 },
              { label: "35–44", pct: 18 },
              { label: "45+", pct: 9 },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>{r.label}</span>
                  <span>{r.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-gradient-brand"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top countries</CardTitle>
          </CardHeader>
          <CardBody className="pt-0 flex flex-col gap-3">
            {[
              { country: "Nigeria", pct: 68 },
              { country: "Ghana", pct: 12 },
              { country: "UK", pct: 8 },
              { country: "US", pct: 7 },
              { country: "Other", pct: 5 },
            ].map((c) => (
              <div key={c.country} className="flex items-center justify-between">
                <span className="text-sm text-white/85">{c.country}</span>
                <span className="text-xs text-white/55">{c.pct}%</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
