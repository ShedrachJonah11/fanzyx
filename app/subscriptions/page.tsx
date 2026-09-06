import Link from "next/link";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { creators } from "@/lib/mock-data";
import { formatNaira } from "@/lib/utils";

export default function SubscriptionsPage() {
  const subs = creators.slice(0, 4);
  const total = subs.reduce((s, c) => s + c.monthlyPrice, 0);

  return (
    <DashboardShell
      variant="fan"
      title="Your subscriptions"
      subtitle={`${subs.length} active · ${formatNaira(total)}/month`}
    >
      <div className="grid gap-4">
        {subs.map((c) => (
          <div
            key={c.id}
            className="surface-card p-4 sm:p-5 flex items-center gap-4 flex-col sm:flex-row"
          >
            <div className="relative shrink-0">
              <div
                className="h-20 w-20 rounded-[14px]"
                style={{ backgroundImage: c.coverGradient }}
              />
              <div className="absolute -bottom-3 -right-3">
                <Avatar name={c.name} gradient={c.avatarGradient} size={40} ring />
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <Link
                href={`/creator/${c.username}`}
                className="text-[15px] font-semibold text-white hover:underline underline-offset-2"
              >
                {c.name}
              </Link>
              <div className="text-xs text-white/50">@{c.username} · {c.category}</div>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="success">Active</Badge>
                <span className="text-xs text-white/60">
                  Renews in 12 days · {formatNaira(c.monthlyPrice)}/mo
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button href={`/creator/${c.username}`} variant="secondary" className="flex-1 sm:flex-none">
                View
              </Button>
              <Button variant="ghost" className="flex-1 sm:flex-none">
                Manage
              </Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
