"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  AtSign,
  Banknote,
  Bell,
  Check,
  DollarSign,
  Gift,
  Heart,
  MessageSquare,
  Radio,
  ShieldCheck,
  ShieldX,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useNotificationsStore } from "@/services/stores/notifications";
import type { NotificationKind, NotificationOut } from "@/services/dtos";
import { cn, timeAgo } from "@/lib/utils";

const POLL_INTERVAL_MS = 60_000;
const FOCUS_REFETCH_MIN_HIDDEN_MS = 30_000;

const kindMeta: Record<
  NotificationKind,
  {
    icon: React.ComponentType<{ className?: string }>;
    tint: string;
    ring: string;
  }
> = {
  subscribe: { icon: Users, tint: "text-[#6929FC]", ring: "bg-[#6929FC]/15" },
  renewal: { icon: Sparkles, tint: "text-[#FD23A7]", ring: "bg-[#FD23A7]/15" },
  tip: { icon: DollarSign, tint: "text-green-300", ring: "bg-green-500/15" },
  comment: {
    icon: MessageSquare,
    tint: "text-[#22D3EE]",
    ring: "bg-[#22D3EE]/15",
  },
  reply: { icon: MessageSquare, tint: "text-[#22D3EE]", ring: "bg-[#22D3EE]/15" },
  mention: { icon: AtSign, tint: "text-[#FD5CC9]", ring: "bg-[#FD5CC9]/15" },
  follow: { icon: UserPlus, tint: "text-[#4340FA]", ring: "bg-[#4340FA]/15" },
  post_new: { icon: Heart, tint: "text-[#FD23A7]", ring: "bg-[#FD23A7]/15" },
  live_start: { icon: Radio, tint: "text-red-300", ring: "bg-red-500/15" },
  payout_paid: {
    icon: Banknote,
    tint: "text-green-300",
    ring: "bg-green-500/15",
  },
  referral_converted: {
    icon: Gift,
    tint: "text-[#FD5CC9]",
    ring: "bg-[#FD5CC9]/15",
  },
  identity_verified: {
    icon: ShieldCheck,
    tint: "text-green-300",
    ring: "bg-green-500/15",
  },
  identity_rejected: {
    icon: ShieldX,
    tint: "text-red-300",
    ring: "bg-red-500/15",
  },
  posts_published: {
    icon: Sparkles,
    tint: "text-[#FD23A7]",
    ring: "bg-[#FD23A7]/15",
  },
  moderation: {
    icon: AlertTriangle,
    tint: "text-yellow-300",
    ring: "bg-yellow-500/15",
  },
  system: { icon: Bell, tint: "text-white/80", ring: "bg-white/10" },
};

const FILTERS: { value: "all" | "unread"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

type Variant = "fan" | "creator";

export function NotificationsView({ variant }: { variant: Variant }) {
  const items = useNotificationsStore((s) => s.items);
  const filter = useNotificationsStore((s) => s.filter);
  const loading = useNotificationsStore((s) => s.loading);
  const loaded = useNotificationsStore((s) => s.loaded);
  const loadingMore = useNotificationsStore((s) => s.loadingMore);
  const hasMore = useNotificationsStore((s) => s.hasMore);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const setFilter = useNotificationsStore((s) => s.setFilter);
  const hydrate = useNotificationsStore((s) => s.hydrate);
  const loadMore = useNotificationsStore((s) => s.loadMore);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const refreshUnreadCount = useNotificationsStore((s) => s.refreshUnreadCount);

  const router = useRouter();
  const [systemModal, setSystemModal] = useState<NotificationOut | null>(null);

  useEffect(() => {
    hydrate(filter);
  }, [filter, hydrate]);

  useEffect(() => {
    const tick = () => refreshUnreadCount();
    const t = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [refreshUnreadCount]);

  const hiddenSinceRef = useRef<number | null>(null);
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenSinceRef.current = Date.now();
        return;
      }
      const since = hiddenSinceRef.current;
      hiddenSinceRef.current = null;
      if (!since) return;
      if (Date.now() - since < FOCUS_REFETCH_MIN_HIDDEN_MS) return;
      hydrate(filter);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [filter, hydrate]);

  const lastRowRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    const node = lastRowRef.current;
    if (!node || !hasMore || loadingMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [items.length, hasMore, loadingMore, loadMore]);

  const routeFor = useCallback(
    (n: NotificationOut): { href?: string; showSystemModal?: boolean } => {
      const isFan = variant === "fan";
      switch (n.kind) {
        case "subscribe":
        case "renewal":
          return { href: isFan ? "/subscriptions" : "/dashboard/subscribers" };
        case "payout_paid":
          return { href: isFan ? "/transactions" : "/dashboard/earnings" };
        case "tip":
          return { href: isFan ? "/transactions" : "/dashboard/transactions" };
        case "referral_converted":
          return { href: isFan ? "/feed" : "/dashboard/referrals" };
        case "identity_verified":
        case "identity_rejected":
          return { href: "/dashboard/settings/identity" };
        case "posts_published":
          // Auto-publish celebration — send them to their own profile so
          // they can see the posts that just went public.
          return { href: isFan ? "/feed" : "/dashboard/posts" };
        case "comment":
        case "reply":
        case "mention":
        case "post_new":
        case "follow":
        case "live_start":
          return { href: isFan ? "/feed" : "/" };
        case "moderation":
        case "system":
        default:
          return { showSystemModal: true };
      }
    },
    [variant]
  );

  const onRowClick = useCallback(
    (n: NotificationOut) => {
      if (!n.readAt) markRead(n.id);
      const routed = routeFor(n);
      if (routed.showSystemModal) {
        setSystemModal(n);
        return;
      }
      if (routed.href) router.push(routed.href);
    },
    [markRead, routeFor, router]
  );

  const showList = loaded && items.length > 0;
  const showEmpty = loaded && items.length === 0;
  const showFirstSkeleton = !loaded && loading;

  const headerSubtitle = useMemo(() => {
    if (!loaded) return "Loading…";
    if (unreadCount > 0) return `${unreadCount} unread`;
    return "All caught up";
  }, [loaded, unreadCount]);

  return (
    <DashboardShell
      variant={variant}
      title="Notifications"
      subtitle={headerSubtitle}
      action={
        <Button
          variant="secondary"
          leftIcon={<Check />}
          onClick={() => {
            if (unreadCount === 0) return;
            markAllRead().catch(() => toast.error("Couldn't mark all as read"));
          }}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </Button>
      }
    >
      <div className="flex gap-2 mb-4">
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

      <div className="surface-card overflow-hidden">
        {showFirstSkeleton ? (
          <NotificationSkeletons count={6} />
        ) : showEmpty ? (
          <EmptyState
            className="!bg-transparent !border-none"
            title={
              filter === "unread"
                ? "You're all caught up."
                : "No notifications yet."
            }
            imageSize={160}
          />
        ) : showList ? (
          <ul>
            {items.map((n, i) => {
              const isLast = i === items.length - 1;
              return (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onClick={() => onRowClick(n)}
                  rowRef={isLast ? lastRowRef : undefined}
                />
              );
            })}
            {loadingMore ? <NotificationSkeletons count={3} /> : null}
          </ul>
        ) : null}
      </div>

      <Modal
        open={!!systemModal}
        onClose={() => setSystemModal(null)}
        title={systemModal?.title}
      >
        <p className="text-sm text-white/75 whitespace-pre-wrap">
          {systemModal?.body || "No further details."}
        </p>
        {systemModal?.createdAt ? (
          <p className="text-[11px] text-white/45 mt-4">
            {timeAgo(systemModal.createdAt)} ago
          </p>
        ) : null}
      </Modal>
    </DashboardShell>
  );
}

function NotificationRow({
  n,
  onClick,
  rowRef,
}: {
  n: NotificationOut;
  onClick: () => void;
  rowRef?: React.Ref<HTMLLIElement>;
}) {
  const meta = kindMeta[n.kind] ?? kindMeta.system;
  const Icon = meta.icon;
  const unread = !n.readAt;
  return (
    <li
      ref={rowRef}
      className={cn(
        "relative border-t border-white/[0.05] first:border-t-0 transition-colors",
        unread ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
      )}
    >
      {unread ? (
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-brand"
        />
      ) : null}
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left flex items-center gap-3 px-5 py-4"
      >
        <div
          className={cn(
            "shrink-0 inline-flex items-center justify-center size-10 rounded-full",
            meta.ring
          )}
        >
          <Icon className={cn("size-5", meta.tint)} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "text-sm truncate",
              unread ? "text-white font-semibold" : "text-white/85"
            )}
          >
            {n.title}
          </div>
          {n.body ? (
            <div className="text-[12px] text-white/55 truncate mt-0.5">
              {n.body}
            </div>
          ) : null}
        </div>
        <div className="text-[11px] text-white/45 shrink-0">
          {timeAgo(n.createdAt)} ago
        </div>
      </button>
    </li>
  );
}

function NotificationSkeletons({ count }: { count: number }) {
  return (
    <ul>
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 px-5 py-4 border-t border-white/[0.05] first:border-t-0"
        >
          <SkeletonCircle size={40} />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-2/5 rounded-full" />
            <Skeleton className="h-2.5 w-3/5 rounded-full" />
          </div>
          <Skeleton className="h-2.5 w-10 rounded-full" />
        </li>
      ))}
    </ul>
  );
}
