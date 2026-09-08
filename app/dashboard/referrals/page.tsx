"use client";

import { useState } from "react";
import { Check, Copy, Gift, Share2, Users } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/services/context";
import { cn, formatNaira } from "@/lib/utils";

const invites = [
  {
    id: "r1",
    name: "Amaka O.",
    username: "amaka",
    gradient: "linear-gradient(135deg,#6929FC,#FD23A7)",
    joined: "3d ago",
    status: "converted" as const,
    reward: 2500,
  },
  {
    id: "r2",
    name: "Chidi E.",
    username: "chidi",
    gradient: "linear-gradient(135deg,#22D3EE,#6929FC)",
    joined: "1w ago",
    status: "converted" as const,
    reward: 2500,
  },
  {
    id: "r3",
    name: "Ify N.",
    username: "ify",
    gradient: "linear-gradient(135deg,#F472B6,#6929FC)",
    joined: "2w ago",
    status: "pending" as const,
    reward: 0,
  },
];

export default function ReferralsPage() {
  const { user } = useAuth();
  const refCode = user?.referralCode || user?.username || "";
  const link = refCode ? `https://fanzyx.app/ref/${refCode}` : "https://fanzyx.app";
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <DashboardShell
      title="Referrals"
      subtitle="Invite friends to FanzyX and earn a reward for every conversion."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <StatCard label="Invites sent" value="18" delta="+4 this week" />
        <StatCard label="Signed up" value="12" delta="+3" />
        <StatCard label="Converted" value="9" delta="75% rate" />
        <StatCard label="Earned" value={formatNaira(22500)} delta="+₦5,000" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your referral link</CardTitle>
            <Badge variant="brand">Earn ₦2,500 per convert</Badge>
          </CardHeader>
          <CardBody className="pt-0 flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-[12px] bg-white/[0.04] hairline p-2">
              <div className="flex-1 min-w-0 px-2 text-sm text-white/85 font-mono truncate">
                {link}
              </div>
              <Button size="sm" onClick={copy} leftIcon={copied ? <Check /> : <Copy />}>
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" variant="secondary" leftIcon={<Share2 />}>
                Share
              </Button>
            </div>
            <p className="text-xs text-white/55">
              Share this link with your audience. Anyone who signs up and subscribes to a
              creator will earn you a reward.
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
            <Step n={4}>You earn ₦2,500 credit</Step>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>People you've invited</CardTitle>
          </CardHeader>
          <CardBody className="pt-0">
            <ul>
              {invites.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center gap-3 py-3 border-t border-white/[0.05] first:border-t-0"
                >
                  <Avatar name={i.name} gradient={i.gradient} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{i.name}</div>
                    <div className="text-[11px] text-white/50">@{i.username} · joined {i.joined}</div>
                  </div>
                  {i.status === "converted" ? (
                    <Badge variant="success">Converted</Badge>
                  ) : (
                    <Badge variant="warning">Pending</Badge>
                  )}
                  <div
                    className={cn(
                      "text-sm font-medium w-24 text-right",
                      i.reward > 0 ? "text-green-300" : "text-white/40"
                    )}
                  >
                    {i.reward > 0 ? `+${formatNaira(i.reward)}` : "—"}
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
