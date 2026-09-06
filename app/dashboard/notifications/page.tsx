import {
  Bell,
  Check,
  DollarSign,
  Heart,
  MessageSquare,
  Sparkles,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { activity } from "@/lib/mock-data";
import { cn, timeAgo } from "@/lib/utils";

const kindMeta: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; tint: string }
> = {
  subscribe: { icon: Users, tint: "text-[#6929FC]" },
  tip: { icon: DollarSign, tint: "text-green-300" },
  comment: { icon: MessageSquare, tint: "text-[#22D3EE]" },
  renewal: { icon: Sparkles, tint: "text-[#FD23A7]" },
};

// Extend with a couple more mocked entries
const extended = [
  ...activity,
  {
    id: "a6",
    kind: "comment" as const,
    actor: "Deji A.",
    actorGradient: "linear-gradient(135deg,#6929FC,#22D3EE)",
    detail: "left a heart on your post",
    time: new Date(Date.now() - 2.4 * 86400000).toISOString(),
  },
  {
    id: "a7",
    kind: "subscribe" as const,
    actor: "Uche V.",
    actorGradient: "linear-gradient(135deg,#22C55E,#0EA5E9)",
    detail: "subscribed to your channel",
    time: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export default function NotificationsPage() {
  const unread = 3;
  return (
    <DashboardShell
      title="Notifications"
      subtitle={`${unread} unread · ${extended.length} total`}
      action={
        <Button variant="secondary" leftIcon={<Check />}>
          Mark all as read
        </Button>
      }
    >
      <div className="surface-card overflow-hidden">
        <ul>
          {extended.map((n, i) => {
            const isUnread = i < unread;
            const meta = kindMeta[n.kind];
            const Icon = meta?.icon ?? Bell;
            return (
              <li
                key={n.id}
                className={cn(
                  "flex items-center gap-3 px-5 py-4 border-t border-white/[0.05] first:border-t-0 relative",
                  isUnread && "bg-white/[0.02]"
                )}
              >
                {isUnread ? (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-gradient-brand" />
                ) : null}
                <div className="relative">
                  <Avatar name={n.actor} gradient={n.actorGradient} size={40} />
                  <span
                    className={cn(
                      "absolute -bottom-1 -right-1 inline-flex items-center justify-center size-5 rounded-full bg-[#0E0E14] ring-2 ring-[#0A0A0F]",
                      meta?.tint
                    )}
                  >
                    <Icon className="size-3" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/85 truncate">
                    <span className="font-medium text-white">{n.actor}</span> {n.detail}
                  </div>
                  <div className="text-[11px] text-white/45 mt-0.5">
                    {timeAgo(n.time)} ago
                  </div>
                </div>
                <button className="text-xs text-white/60 hover:text-white shrink-0">
                  View
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </DashboardShell>
  );
}
