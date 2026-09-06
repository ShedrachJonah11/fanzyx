"use client";

import { useState } from "react";
import { Bell, CreditCard, Lock, Shield, User as UserIcon, UserCog } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { currentCreator } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Section = "profile" | "account" | "notifications" | "privacy" | "security" | "subscription";

const sections: { value: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "profile", label: "Profile", icon: UserIcon },
  { value: "account", label: "Account", icon: UserCog },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "privacy", label: "Privacy", icon: Shield },
  { value: "security", label: "Security", icon: Lock },
  { value: "subscription", label: "Subscription", icon: CreditCard },
];

export default function FanSettingsPage() {
  const [tab, setTab] = useState<Section>("profile");
  return (
    <DashboardShell variant="fan" title="Settings" subtitle="Manage your account.">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="surface-card p-2 h-max sticky top-24">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto">
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
                    <Icon className="size-4" />
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="surface-card p-6 flex flex-col gap-5">
          {tab === "profile" ? (
            <>
              <SectionHead title="Profile" body="This information appears on your account." />
              <div className="flex items-center gap-4">
                <Avatar name={currentCreator.name} gradient={currentCreator.avatarGradient} size={72} />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">Upload</Button>
                  <Button variant="ghost" size="sm">Remove</Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Display name" defaultValue={currentCreator.name} />
                <Input label="Username" defaultValue={currentCreator.username} />
              </div>
              <Button className="self-start mt-2">Save</Button>
            </>
          ) : null}
          {tab !== "profile" ? (
            <>
              <SectionHead title={cap(tab)} body="Configure your preferences." />
              <p className="text-sm text-white/55">
                Preferences for {tab} appear here.
              </p>
            </>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}

function SectionHead({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="text-sm text-white/55 mt-1">{body}</p>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
