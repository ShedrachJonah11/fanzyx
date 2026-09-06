"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CreditCard,
  Landmark,
  Plus,
  ShieldCheck,
  Smartphone,
  Wallet as WalletIcon,
} from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { cn, formatNaira } from "@/lib/utils";

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

const recentTx = [
  { id: "w1", type: "topup" as const, label: "Top up · Bank transfer", amount: 10000, date: "Today · 09:14" },
  { id: "w2", type: "spend" as const, label: "Subscribed to @zarabello", amount: -3500, date: "Yesterday · 20:02" },
  { id: "w3", type: "spend" as const, label: "PPV unlock · Sample pack", amount: -3500, date: "Yesterday · 12:41" },
  { id: "w4", type: "topup" as const, label: "Top up · Card", amount: 15000, date: "2 days ago" },
  { id: "w5", type: "spend" as const, label: "Tipped @ijeoma", amount: -2000, date: "3 days ago" },
];

const paymentMethods = [
  {
    id: "pm1",
    kind: "Card",
    label: "Visa · •••• 4821",
    icon: CreditCard,
    isDefault: true,
  },
  {
    id: "pm2",
    kind: "Bank",
    label: "Kuda · Instant",
    icon: Landmark,
    isDefault: false,
  },
  {
    id: "pm3",
    kind: "USSD",
    label: "*737# GTBank",
    icon: Smartphone,
    isDefault: false,
  },
];

export default function WalletPage() {
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState(5000);
  const [methodId, setMethodId] = useState(paymentMethods[0].id);

  const balance = 18450;
  const pending = 3500;

  return (
    <DashboardShell
      variant="fan"
      title="Wallet"
      subtitle="Fund your wallet to subscribe, tip, and unlock exclusive content."
      action={
        <Button leftIcon={<Plus />} onClick={() => setTopUpOpen(true)}>
          Add funds
        </Button>
      }
    >
      {/* Balance + stats */}
      <div className="grid gap-4 lg:grid-cols-3 mb-4">
        <Card className="lg:col-span-1 !bg-none">
          <div className="relative overflow-hidden rounded-[16px]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(105,41,252,0.28) 0%, rgba(253,35,167,0.22) 100%)",
              }}
            />
            <div className="relative p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-white/70">
                  Wallet balance
                </span>
                <WalletIcon className="size-4 text-white/70" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-4xl font-semibold text-white">
                  {formatNaira(balance)}
                </span>
                <span className="text-xs text-white/60">
                  {pending > 0
                    ? `${formatNaira(pending)} pending clearance`
                    : "All funds available"}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="flex-1" leftIcon={<Plus />} onClick={() => setTopUpOpen(true)}>
                  Add funds
                </Button>
                <Button
                  href="/transactions"
                  variant="secondary"
                  className="flex-1"
                  leftIcon={<Receipt />}
                >
                  History
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <StatCard label="Total funded" value={formatNaira(85000)} delta="+₦15k this month" />
          <StatCard label="Total spent" value={formatNaira(66550)} delta="12 subscriptions" />
          <StatCard label="Tips sent" value={formatNaira(4200)} delta="3 creators" />
          <StatCard label="Saved" value={formatNaira(8250)} delta="via bundles" />
        </div>
      </div>

      {/* Recent activity + Payment methods */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link
              href="/transactions"
              className="text-xs text-white/70 hover:text-white inline-flex items-center gap-1"
            >
              View all <ArrowUpRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardBody className="pt-0">
            <ul>
              {recentTx.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 py-3 border-t border-white/[0.05] first:border-t-0"
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center size-8 rounded-full text-white",
                      t.type === "topup"
                        ? "bg-green-500/15 text-green-300"
                        : "bg-white/[0.05] text-white/75"
                    )}
                  >
                    {t.type === "topup" ? (
                      <Plus className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/90 truncate">{t.label}</div>
                    <div className="text-[11px] text-white/50 mt-0.5">{t.date}</div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      t.amount < 0 ? "text-red-300" : "text-green-300"
                    )}
                  >
                    {t.amount < 0 ? "" : "+"}
                    {formatNaira(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment methods</CardTitle>
            <button className="text-xs text-white/70 hover:text-white inline-flex items-center gap-1">
              <Plus className="size-3.5" /> Add
            </button>
          </CardHeader>
          <CardBody className="pt-0 flex flex-col gap-2">
            {paymentMethods.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-[12px] hairline bg-white/[0.03] p-3"
                >
                  <span className="inline-flex items-center justify-center size-9 rounded-[10px] bg-gradient-brand-soft border border-white/10 text-white/85 shrink-0">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{m.label}</div>
                    <div className="text-[11px] text-white/55">{m.kind}</div>
                  </div>
                  {m.isDefault ? <Badge variant="brand">Default</Badge> : null}
                </div>
              );
            })}
            <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
              <ShieldCheck className="size-3.5 text-white/70" />
              Payments are encrypted end-to-end.
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Add funds modal */}
      <Modal open={topUpOpen} onClose={() => setTopUpOpen(false)} title="Add funds" size="md">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/70">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">₦</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="w-full h-12 rounded-[12px] bg-white/[0.04] hairline text-[15px] text-white pl-8 pr-4 outline-none focus:border-white/25"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={cn(
                    "h-8 px-3 rounded-full text-xs border transition-colors",
                    v === amount
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.04] text-white/75 border-white/10 hover:bg-white/[0.08]"
                  )}
                >
                  {formatNaira(v, { compact: true })}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/70">Payment method</label>
            <div className="flex flex-col gap-2">
              {paymentMethods.map((m) => {
                const Icon = m.icon;
                const active = m.id === methodId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethodId(m.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-[12px] p-3 border transition-all text-left",
                      active
                        ? "bg-gradient-brand-soft border-white/15"
                        : "bg-white/[0.03] border-transparent hover:bg-white/[0.05]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-flex items-center justify-center size-4 rounded-full border",
                        active ? "border-white bg-white" : "border-white/30"
                      )}
                    >
                      {active ? <span className="size-1.5 rounded-full bg-black" /> : null}
                    </span>
                    <Icon className="size-4 text-white/85 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white font-medium truncate">{m.label}</div>
                      <div className="text-[11px] text-white/55">{m.kind}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/60 rounded-[12px] bg-white/[0.03] hairline p-3">
            <span>You'll be charged</span>
            <span className="text-white font-semibold">{formatNaira(amount)}</span>
          </div>

          <Button size="lg" className="w-full" disabled={amount <= 0}>
            Continue to payment
          </Button>
        </div>
      </Modal>
    </DashboardShell>
  );
}

function Receipt(props: React.SVGProps<SVGSVGElement>) {
  // Local re-export so we don't need to add another lucide import in this file.
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}
