"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Copy, Share2 } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/services/context";
import { referrals as api } from "@/services/modules/referrals";
import { ApiError } from "@/services/apiClient";
import type { ReferralOut, ReferralSummaryOut } from "@/services/dtos";
import { cn, formatNaira, timeAgo } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

export default function ReferralsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReferralSummaryOut | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [items, setItems] = useState<ReferralOut[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copied, setCopied] = useState(false);

  const fallbackLink = user?.username
    ? `https://fanzyx.app/ref/${user.username}`
    : "https://fanzyx.app";
  const link = summary?.shareUrl || fallbackLink;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, page] = await Promise.all([api.summary(), api.list()]);
        if (cancelled) return;
        setSummary(s);
        setItems(page.items);
        setNextCursor(page.nextCursor);
      } catch (e) {
        if (e instanceof ApiError && e.detail) toast.error(e.detail);
      } finally {
        if (!cancelled) {
          setSummaryLoading(false);
          setListLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.list({ cursor: nextCursor });
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      // Silent — the sentinel will retry on next intersection.
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  const lastRowRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    const node = lastRowRef.current;
    if (!node || !nextCursor || loadingMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [items.length, nextCursor, loadingMore, loadMore]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "Join me on FanzyX",
          text: "Sign up on FanzyX with my link.",
          url: link,
        });
      } catch {
        // User dismissed — no-op.
      }
      return;
    }
    copy();
  };

  const rewardPer = summary?.rewardPerConversionKobo ?? 0;

  return (
    <DashboardShell
      title="Referrals"
      subtitle="Invite friends to FanzyX and earn a reward for every conversion."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <StatCard
          label="Invites sent"
          value={summaryLoading ? "—" : String(summary?.invitesSent ?? 0)}
        />
        <StatCard
          label="Signed up"
          value={summaryLoading ? "—" : String(summary?.signedUp ?? 0)}
        />
        <StatCard
          label="Converted"
          value={summaryLoading ? "—" : String(summary?.converted ?? 0)}
          delta={
            summary && summary.signedUp > 0
              ? `${Math.round((summary.converted / summary.signedUp) * 100)}% rate`
              : undefined
          }
        />
        <StatCard
          label="Earned"
          value={
            summaryLoading ? "—" : formatNaira((summary?.earnedKobo ?? 0) / 100)
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your referral link</CardTitle>
            {rewardPer > 0 ? (
              <Badge variant="brand">
                Earn {formatNaira(rewardPer / 100)} per convert
              </Badge>
            ) : null}
          </CardHeader>
          <CardBody className="pt-0 flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-[12px] bg-white/[0.04] hairline p-2">
              <div className="flex-1 min-w-0 px-2 text-sm text-white/85 font-mono truncate">
                {link}
              </div>
              <Button
                size="sm"
                onClick={copy}
                leftIcon={copied ? <Check /> : <Copy />}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Share2 />}
                onClick={share}
              >
                Share
              </Button>
            </div>
            <p className="text-xs text-white/55">
              Share this link with your audience. Anyone who signs up and
              subscribes to a creator will earn you a reward.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardBody className="pt-0 flex flex-col gap-3 text-sm text-white/75">
            <Step n={1}>Share your unique link</Step>
            <Step n={2}>A friend signs up on FanzyX</Step>
            <Step n={3}>They subscribe to any creator</Step>
            <Step n={4}>
              You earn{" "}
              {rewardPer > 0 ? formatNaira(rewardPer / 100) : "a reward"}{" "}
              credit
            </Step>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>People you&apos;ve invited</CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            {listLoading ? (
              <InviteSkeletons count={4} />
            ) : items.length === 0 ? (
              <EmptyState
                className="!bg-transparent !border-none"
                title="No invites yet"
                body="Share your link — every conversion earns you a reward."
                imageSize={140}
              />
            ) : (
              <ul>
                {items.map((r, i) => {
                  const isLast = i === items.length - 1;
                  const name =
                    r.invitee?.displayName ||
                    r.invitee?.username ||
                    "Anonymous fan";
                  const username = r.invitee?.username;
                  const joined = r.joinedAt
                    ? `joined ${timeAgo(r.joinedAt)} ago`
                    : "not signed up yet";
                  return (
                    <li
                      key={r.id}
                      ref={isLast ? lastRowRef : undefined}
                      className="flex items-center gap-3 py-3 border-t border-white/[0.05] first:border-t-0"
                    >
                      <Avatar
                        name={name}
                        gradient={BRAND_GRADIENT}
                        image={r.invitee?.avatarUrl ?? undefined}
                        size={36}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">
                          {name}
                        </div>
                        <div className="text-[11px] text-white/50 truncate">
                          {username ? `@${username} · ` : ""}
                          {joined}
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                      <div
                        className={cn(
                          "text-sm font-medium w-24 text-right tabular-nums",
                          r.rewardKobo > 0 ? "text-green-300" : "text-white/40"
                        )}
                      >
                        {r.rewardKobo > 0
                          ? `+${formatNaira(r.rewardKobo / 100)}`
                          : "—"}
                      </div>
                    </li>
                  );
                })}
                {loadingMore ? <InviteSkeletons count={2} /> : null}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}

function StatusBadge({ status }: { status: ReferralOut["status"] }) {
  if (status === "converted")
    return <Badge variant="success">Converted</Badge>;
  if (status === "signed_up")
    return <Badge variant="warning">Signed up</Badge>;
  return <Badge variant="warning">Pending</Badge>;
}

function InviteSkeletons({ count }: { count: number }) {
  return (
    <ul>
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 py-3 border-t border-white/[0.05] first:border-t-0"
        >
          <SkeletonCircle size={36} />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-32 rounded-full" />
            <Skeleton className="h-2.5 w-48 rounded-full" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-16 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex items-center justify-center size-6 rounded-full bg-gradient-brand text-white text-[11px] font-semibold shrink-0">
        {n}
      </span>
      <span>{children}</span>
    </div>
  );
}
