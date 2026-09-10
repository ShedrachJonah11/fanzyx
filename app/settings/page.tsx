"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  CreditCard,
  Lock,
  Shield,
  TriangleAlert,
  User as UserIcon,
  UserCog,
} from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";
import { useAuth } from "@/services/context";
import { ApiError } from "@/services/apiClient";
import type { UpdateMeIn } from "@/services/dtos";
import { cn } from "@/lib/utils";

type Section = "profile" | "account" | "notifications" | "privacy" | "security" | "subscription";

const sections: {
  value: Section;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "profile", label: "Profile", icon: UserIcon },
  { value: "account", label: "Account", icon: UserCog },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "privacy", label: "Privacy", icon: Shield },
  { value: "security", label: "Security", icon: Lock },
  { value: "subscription", label: "Subscription", icon: CreditCard },
];

export default function FanSettingsPage() {
  const [tab, setTab] = useState<Section>("profile");
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "creator") router.replace("/dashboard/settings");
  }, [user, router]);

  if (user?.role === "creator") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <span className="size-6 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
      </div>
    );
  }

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

        <div className="surface-card p-6 flex flex-col gap-6">
          {tab === "profile" ? <ProfileSection /> : null}
          {tab === "account" ? <AccountSection /> : null}
          {tab !== "profile" && tab !== "account" ? (
            <>
              <SectionHead title={cap(tab)} body="Configure your preferences." />
              <p className="text-sm text-white/55">Preferences for {tab} appear here.</p>
            </>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}

/* ── Profile ─────────────────────────────────────────── */

function ProfileSection() {
  const { user, updateMe, loading: authLoading } = useAuth();
  const [form, setForm] = useState<UpdateMeIn>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      displayName: user.displayName ?? "",
      bio: user.bio ?? "",
      avatarUrl: user.avatarUrl ?? "",
      coverUrl: user.coverUrl ?? "",
    });
  }, [user]);

  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      (form.displayName ?? "") !== (user.displayName ?? "") ||
      (form.bio ?? "") !== (user.bio ?? "") ||
      (form.avatarUrl ?? "") !== (user.avatarUrl ?? "") ||
      (form.coverUrl ?? "") !== (user.coverUrl ?? "")
    );
  }, [form, user]);

  const set = <K extends keyof UpdateMeIn>(key: K, value: UpdateMeIn[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const patch: UpdateMeIn = {};
      if ((form.displayName ?? "") !== (user?.displayName ?? ""))
        patch.displayName = form.displayName?.trim() || undefined;
      if ((form.bio ?? "") !== (user?.bio ?? ""))
        patch.bio = form.bio?.trim() || undefined;
      if ((form.avatarUrl ?? "") !== (user?.avatarUrl ?? ""))
        patch.avatarUrl = form.avatarUrl?.trim() || undefined;
      if ((form.coverUrl ?? "") !== (user?.coverUrl ?? ""))
        patch.coverUrl = form.coverUrl?.trim() || undefined;
      await updateMe(patch);
      toast.success("Profile saved");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.detail ?? e.message : "Couldn't save profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex flex-col gap-6" aria-busy>
        <div className="flex items-center gap-4">
          <SkeletonCircle size={72} />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-[12px]" />
        <Skeleton className="h-28 w-full rounded-[12px]" />
        <Skeleton className="h-10 w-32 rounded-full self-end" />
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <SectionHead title="Profile" body="This information is visible to fans on your profile." />

      <div className="flex items-center gap-4">
        <Avatar
          name={form.displayName || user.username}
          image={form.avatarUrl || user.avatarUrl || undefined}
          gradient="linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)"
          size={72}
        />
        <div className="flex flex-col text-sm">
          <span className="text-white font-medium">@{user.username}</span>
          <span className="text-white/50 text-xs">
            {user.role === "creator" ? "Creator account" : "Fan account"}
            {user.verified ? " · verified" : ""}
          </span>
        </div>
      </div>

      <Input
        label="Display name"
        placeholder="Your name"
        value={form.displayName ?? ""}
        onChange={(e) => set("displayName", e.target.value)}
        maxLength={80}
      />

      <Textarea
        label={`Bio (${(form.bio ?? "").length}/500)`}
        placeholder="Tell creators a little about you…"
        value={form.bio ?? ""}
        onChange={(e) => set("bio", e.target.value.slice(0, 500))}
      />

      <div className="flex justify-end pt-2 border-t border-white/[0.05]">
        <Button type="submit" disabled={!dirty || saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

/* ── Account (delete) ────────────────────────────────── */

function AccountSection() {
  const { user } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <SectionHead title="Account" body="Manage your account." />

      <div className="rounded-[14px] border border-red-500/20 bg-red-500/[0.05] p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center size-9 rounded-full bg-red-500/15 text-red-300 shrink-0">
            <TriangleAlert className="size-4" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-white">Delete my account</h3>
            <p className="text-sm text-white/60 mt-1 max-w-md">
              This soft-deletes your account and revokes all sessions. Restoration is
              only possible from support within 30 days.
            </p>
          </div>
        </div>
        <div>
          <Button
            variant="secondary"
            className="!text-red-200 !bg-red-500/10 !border-red-500/30 hover:!bg-red-500/20"
            onClick={() => setConfirmOpen(true)}
            disabled={!user}
          >
            Delete account
          </Button>
        </div>
      </div>

      {confirmOpen && user ? (
        <DeleteAccountModal
          username={user.username}
          onClose={() => setConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}

function DeleteAccountModal({
  username,
  onClose,
}: {
  username: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { deleteMe } = useAuth();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const match = typed.trim() === username;

  const confirm = async () => {
    if (!match || busy) return;
    setBusy(true);
    try {
      await deleteMe();
      toast.success("Your account has been deleted");
      router.replace("/goodbye");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.detail ?? e.message : "Couldn't delete account";
      toast.error(msg);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />
      <div className="relative w-full max-w-md surface-card p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center size-10 rounded-full bg-red-500/15 text-red-300 shrink-0">
            <TriangleAlert className="size-5" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Delete your account</h3>
            <p className="text-sm text-white/60 mt-1">
              This is permanent. Type <span className="text-white font-medium">@{username}</span>{" "}
              below to confirm.
            </p>
          </div>
        </div>

        <Input
          label={`Type @${username}`}
          placeholder={`@${username}`}
          value={typed}
          onChange={(e) => setTyped(e.target.value.replace(/^@/, ""))}
          autoFocus
        />

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            className="!bg-red-500 !text-white hover:!bg-red-500/90"
            disabled={!match || busy}
            onClick={confirm}
          >
            {busy ? "Deleting…" : "Delete permanently"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── shared ──────────────────────────────────────────── */

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
