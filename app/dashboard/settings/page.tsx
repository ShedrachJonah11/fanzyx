"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  CreditCard,
  Lock,
  Shield,
  User as UserIcon,
  Wallet,
  UserCog,
} from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/services/context";
import { creatorSubscription } from "@/services/modules/creator";
import { ApiError } from "@/services/apiClient";
import type { SubscriptionPricingOut } from "@/services/dtos";
import { cn, formatNaira } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

type Section =
  | "profile"
  | "account"
  | "notifications"
  | "privacy"
  | "security"
  | "subscription"
  | "payouts";

const sections: { value: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "profile", label: "Profile", icon: UserIcon },
  { value: "account", label: "Account", icon: UserCog },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "privacy", label: "Privacy", icon: Shield },
  { value: "security", label: "Security", icon: Lock },
  { value: "subscription", label: "Subscription", icon: CreditCard },
  { value: "payouts", label: "Payouts", icon: Wallet },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Section>("profile");
  const { user } = useAuth();

  return (
    <DashboardShell title="Settings" subtitle="Manage your account and preferences.">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="surface-card p-2 h-max sticky top-24">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {sections.map((s) => {
              const active = tab === s.value;
              const Icon = s.icon;
              return (
                <li key={s.value} className="shrink-0">
                  <button
                    onClick={() => setTab(s.value)}
                    className={cn(
                      "w-full inline-flex items-center gap-2.5 h-9 px-3 rounded-[10px] text-sm whitespace-nowrap",
                      active
                        ? "bg-white/[0.06] text-white"
                        : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className="size-[16px]" />
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="flex flex-col gap-4">
          {tab === "profile" ? <ProfileSection /> : null}
          {tab === "account" ? (
            <BasicCard title="Account" body="Change your email address, username, and language.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Email" defaultValue={user?.email ?? ""} readOnly />
                <Input
                  label="Username"
                  defaultValue={user?.username ?? ""}
                  key={user?.username}
                />
              </div>
              <Button className="self-start mt-2">Save changes</Button>
            </BasicCard>
          ) : null}
          {tab === "notifications" ? (
            <BasicCard title="Notifications" body="Choose what you get notified about.">
              <ToggleRow label="New subscribers" defaultOn />
              <ToggleRow label="Tips" defaultOn />
              <ToggleRow label="Direct messages" defaultOn />
              <ToggleRow label="Weekly summary" />
              <ToggleRow label="Product updates" />
            </BasicCard>
          ) : null}
          {tab === "privacy" ? (
            <BasicCard title="Privacy" body="Control who can see and message you.">
              <ToggleRow label="Show subscriber count" defaultOn />
              <ToggleRow label="Allow messages from non-subscribers" />
              <ToggleRow label="Appear in explore" defaultOn />
            </BasicCard>
          ) : null}
          {tab === "security" ? (
            <BasicCard title="Security" body="Keep your account safe.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input type="password" label="Current password" placeholder="••••••••" />
                <Input type="password" label="New password" placeholder="••••••••" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Button>Update password</Button>
                <Badge variant="brand">2FA · On</Badge>
              </div>
            </BasicCard>
          ) : null}
          {tab === "subscription" ? <SubscriptionSection /> : null}
          {tab === "payouts" ? (
            <BasicCard title="Payouts" body="Manage where and how you get paid.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Bank" defaultValue="Kuda Microfinance Bank" />
                <Input label="Account number" defaultValue="•••• •••• 4821" />
              </div>
              <Button className="self-start mt-2">Update payout details</Button>
            </BasicCard>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  const displayName = user?.displayName || user?.username || "You";

  return (
    <BasicCard title="Profile" body="This information appears on your public profile.">
      <div className="flex items-center gap-4">
        <Avatar
          name={displayName}
          gradient={BRAND_GRADIENT}
          image={user?.avatarUrl ?? undefined}
          size={72}
        />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            Upload
          </Button>
          <Button variant="ghost" size="sm">
            Remove
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Display name"
          defaultValue={user?.displayName ?? ""}
          key={`dn-${user?.id}`}
        />
        <Input
          label="Username"
          defaultValue={user?.username ?? ""}
          key={`un-${user?.id}`}
        />
      </div>
      <Textarea
        label="Bio"
        defaultValue={user?.bio ?? ""}
        key={`bio-${user?.id}`}
      />
      <div className="flex items-center gap-3 mt-2">
        <Button>Save changes</Button>
        <Button variant="ghost">Cancel</Button>
      </div>
    </BasicCard>
  );
}

function BasicCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="surface-card p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/55 mt-1">{body}</p>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-2.5 border-t border-white/[0.05] first:border-t-0">
      <span className="text-sm text-white/85">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          on ? "bg-gradient-brand" : "bg-white/[0.1]"
        )}
        aria-pressed={on}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            on ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

/* ── Subscription pricing ─────────────────────────────────────────── */

const MAX_NAIRA = 50_000;
const MAX_KOBO = MAX_NAIRA * 100;

function SubscriptionSection() {
  const [pricing, setPricing] = useState<SubscriptionPricingOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [baseNaira, setBaseNaira] = useState<string>("");
  const [discountPct, setDiscountPct] = useState<string>("0");
  const [expiryDate, setExpiryDate] = useState<string>(""); // yyyy-mm-dd

  const load = async () => {
    setLoading(true);
    try {
      const p = await creatorSubscription.get();
      applyServerState(p);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  const applyServerState = (p: SubscriptionPricingOut) => {
    setPricing(p);
    setBaseNaira(String(Math.round(p.monthlyPriceKobo / 100)));
    setDiscountPct(String(p.discountPct ?? 0));
    setExpiryDate(
      p.discountExpiresAt
        ? new Date(p.discountExpiresAt).toISOString().slice(0, 10)
        : ""
    );
  };

  useEffect(() => {
    load();
  }, []);

  const baseNum = Number(baseNaira);
  const pctNum = Number(discountPct);
  const baseKobo = Math.round((Number.isFinite(baseNum) ? baseNum : 0) * 100);
  const validBase = Number.isFinite(baseNum) && baseNum >= 1 && baseNum <= MAX_NAIRA;
  const validPct =
    Number.isFinite(pctNum) && pctNum >= 0 && pctNum <= 100 && Number.isInteger(pctNum);
  const expiryDateObj = expiryDate ? new Date(`${expiryDate}T23:59:59`) : null;
  const validExpiry = !expiryDateObj || expiryDateObj.getTime() > Date.now();
  const canSave = validBase && validPct && validExpiry && !saving && !loading;

  const preview = useMemo(() => {
    const rows = [1, 2, 3].map((months) => {
      const gross = baseKobo * months;
      const discountKobo = Math.round((gross * (validPct ? pctNum : 0)) / 100);
      const priceKobo = gross - discountKobo;
      return { months, gross, discountKobo, priceKobo };
    });
    return rows;
  }, [baseKobo, pctNum, validPct]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const patch: {
        monthlyPriceKobo: number;
        discountPct?: number;
        discountExpiresAt?: string | null;
      } = {
        monthlyPriceKobo: Math.min(baseKobo, MAX_KOBO),
      };
      patch.discountPct = pctNum;
      if (expiryDate) {
        patch.discountExpiresAt = new Date(`${expiryDate}T23:59:59`).toISOString();
      } else if (pricing?.discountExpiresAt) {
        patch.discountExpiresAt = null; // clear existing expiry
      }
      const res = await creatorSubscription.update(patch);
      applyServerState(res);
      toast.success("Subscription updated");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "validation_error"
            ? "Check the values and try again."
            : e.detail ?? e.message
          : "Couldn't save subscription";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const discountLive = validPct && pctNum > 0;
  const active = pricing?.discountActive ?? false;

  return (
    <div className="surface-card p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Create subscription</h2>
        <p className="text-sm text-white/55 mt-1">
          Set your base monthly price. Add an optional discount that applies to all
          three durations. Fans can subscribe for 1, 2, or 3 months.
        </p>
      </div>

      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <span className="size-6 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
        </div>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/70">Base amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/55">₦</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_NAIRA}
                  step={1}
                  value={baseNaira}
                  onChange={(e) => setBaseNaira(e.target.value)}
                  className={cn(
                    "w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white pl-8 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors",
                    !validBase && baseNaira && "border-red-400/40"
                  )}
                />
              </div>
              <span className="text-[11px] text-white/45">
                Max: {formatNaira(MAX_NAIRA)}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/70">
                Attach discount (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  step={1}
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className={cn(
                    "w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white pl-4 pr-10 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors",
                    !validPct && discountPct && "border-red-400/40"
                  )}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/55">%</span>
              </div>
              <span className="text-[11px] text-white/45">
                0 to disable. Applies to all durations.
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/70">
                Discount expiry (optional)
              </label>
              <input
                type="date"
                value={expiryDate}
                min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={!discountLive}
                className={cn(
                  "w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white px-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors disabled:opacity-50",
                  !validExpiry && "border-red-400/40"
                )}
              />
              <span className="text-[11px] text-white/45">
                {discountLive
                  ? expiryDate
                    ? "Discount auto-turns off after this date."
                    : "Leave blank for no expiry."
                  : "Set a discount % first."}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/70">Status</label>
              <div className="h-11 rounded-[12px] hairline bg-white/[0.03] px-4 flex items-center">
                {pricing && pricing.discountPct > 0 ? (
                  active ? (
                    <Badge variant="brand">Discount active</Badge>
                  ) : (
                    <Badge>Discount expired</Badge>
                  )
                ) : (
                  <span className="text-sm text-white/55">No discount</span>
                )}
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-[14px] hairline bg-white/[0.02] p-4 flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wider text-white/45">
              Preview
            </span>
            <ul className="flex flex-col divide-y divide-white/[0.05]">
              {preview.map((row) => (
                <li
                  key={row.months}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="text-white/80">
                    {row.months} {row.months === 1 ? "month" : "months"}
                  </span>
                  <div className="flex items-baseline gap-2">
                    {row.discountKobo > 0 ? (
                      <span className="text-[11px] text-white/40 line-through">
                        {formatNaira(row.gross / 100)}
                      </span>
                    ) : null}
                    <span className="text-white font-semibold">
                      {formatNaira(row.priceKobo / 100)}
                    </span>
                    <span
                      className={cn(
                        "text-[11px]",
                        row.discountKobo > 0 ? "text-[#FD5CC9]" : "text-white/30"
                      )}
                    >
                      {row.discountKobo > 0
                        ? `${formatNaira(row.discountKobo / 100)} off`
                        : "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!canSave}>
              {saving ? "Saving…" : "Save"}
            </Button>
            {!validExpiry ? (
              <span className="text-xs text-red-300">Expiry must be a future date.</span>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
