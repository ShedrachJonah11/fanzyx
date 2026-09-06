"use client";

import { useState } from "react";
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
import { currentCreator } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

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
                <Input label="Email" defaultValue="alex@fanzyx.app" />
                <Input label="Username" defaultValue={currentCreator.username} />
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
          {tab === "subscription" ? (
            <BasicCard title="Subscription" body="Set your monthly plan price and welcome message.">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-white/70 mb-1.5 block">Monthly price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/55">₦</span>
                    <input
                      type="number"
                      defaultValue={currentCreator.monthlyPrice}
                      className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white pl-8 pr-4 outline-none focus:border-white/25"
                    />
                  </div>
                </div>
              </div>
              <Textarea
                label="Welcome message"
                placeholder="A short thank-you to new subscribers"
                defaultValue="Welcome! Check out my subscriber-only posts and message me anytime."
              />
            </BasicCard>
          ) : null}
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
  return (
    <BasicCard title="Profile" body="This information appears on your public profile.">
      <div className="flex items-center gap-4">
        <Avatar
          name={currentCreator.name}
          gradient={currentCreator.avatarGradient}
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
        <Input label="Display name" defaultValue={currentCreator.name} />
        <Input label="Username" defaultValue={currentCreator.username} />
      </div>
      <Textarea label="Bio" defaultValue={currentCreator.bio} />
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
