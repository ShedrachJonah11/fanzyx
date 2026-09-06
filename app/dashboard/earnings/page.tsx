import { ArrowDownRight, ArrowUpRight, DollarSign } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EarningsChart } from "@/components/EarningsChart";
import { Badge } from "@/components/ui/Badge";
import { earningsSeries, transactions } from "@/lib/mock-data";
import { formatNaira } from "@/lib/utils";

export default function EarningsPage() {
  const available = 842500;
  const thisMonth = 428500;
  const lastMonth = 402000;
  const pending = 42500;
  const lifetime = 3812000;

  return (
    <DashboardShell
      title="Earnings"
      subtitle="Track your revenue, tips, and payouts."
      action={<Button leftIcon={<DollarSign />}>Withdraw</Button>}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1 !bg-none" >
          <div className="relative overflow-hidden rounded-[16px]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(105,41,252,0.25) 0%, rgba(253,35,167,0.20) 100%)",
              }}
            />
            <div className="relative p-6 flex flex-col gap-6">
              <span className="text-xs uppercase tracking-wider text-white/70">
                Available balance
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-4xl font-semibold text-white">
                  {formatNaira(available)}
                </span>
                <span className="text-xs text-white/60">
                  Next payout in 6 days · monthly cycle
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1" leftIcon={<DollarSign />}>
                  Withdraw
                </Button>
                <Button variant="secondary" className="flex-1">
                  Payout settings
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <StatCard label="This month" value={formatNaira(thisMonth)} delta="+6.6%" />
          <StatCard label="Last month" value={formatNaira(lastMonth)} delta="+4.1%" />
          <StatCard label="Pending" value={formatNaira(pending)} delta="Clears in 6d" positive />
          <StatCard label="Lifetime" value={formatNaira(lifetime)} delta="All-time" positive />
        </div>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Monthly earnings</CardTitle>
            <Badge variant="brand">Last 11 months</Badge>
          </CardHeader>
          <CardBody className="pt-0">
            <EarningsChart data={earningsSeries} height={240} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <a href="#" className="text-xs text-white/60 hover:text-white">
              Export CSV
            </a>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="hidden md:grid grid-cols-[140px_1fr_120px_140px_100px] gap-4 px-1 py-2 text-[11px] uppercase tracking-wider text-white/45 border-b border-white/[0.05]">
              <div>Date</div>
              <div>Description</div>
              <div>Type</div>
              <div className="text-right">Amount</div>
              <div className="text-right">Status</div>
            </div>
            <ul>
              {transactions.map((t) => (
                <li
                  key={t.id}
                  className="grid grid-cols-1 md:grid-cols-[140px_1fr_120px_140px_100px] gap-2 md:gap-4 px-1 py-3 border-t border-white/[0.05] items-center"
                >
                  <div className="text-xs text-white/55">
                    {new Date(t.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                  <div className="text-sm text-white/85">{t.description}</div>
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
                    {t.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-300">
                        <ArrowUpRight className="size-3" /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                        <ArrowDownRight className="size-3" /> Pending
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; variant: "brand" | "warning" | "success" | "muted" | "danger" }> = {
    subscription: { label: "Subscription", variant: "brand" },
    tip: { label: "Tip", variant: "success" },
    ppv: { label: "PPV", variant: "warning" },
    fee: { label: "Fee", variant: "muted" },
    withdrawal: { label: "Withdrawal", variant: "muted" },
  };
  const entry = map[type] ?? map.fee;
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}
