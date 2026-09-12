"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Lock,
  ShieldCheck,
  TriangleAlert,
  User as UserIcon,
  Wallet,
  X,
} from "lucide-react";
import {
  InstagramIcon,
  TikTokIcon,
  WebsiteIcon,
  XIcon,
} from "@/components/icons";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/services/context";
import { creatorPayout, creatorSubscription } from "@/services/modules/creator";
import { auth } from "@/services/modules/auth";
import { users as usersApi } from "@/services/modules/users";
import { geo, creatorBlacklist } from "@/services/modules/geo";
import { twoFactor } from "@/services/modules/twoFactor";
import { ApiError } from "@/services/apiClient";
import type {
  Bank,
  Country,
  ResolveAccountOut,
  SubscriptionPricingOut,
  SubscriptionMonths,
  TwoFactorSetupOut,
  UpdateMeIn,
  UserSocials,
} from "@/services/dtos";
import { cn, formatNaira } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

type Section =
  | "profile"
  | "security"
  | "notifications"
  | "privacy"
  | "subscription"
  | "payouts";

const sections: {
  value: Section;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "profile", label: "Profile", icon: UserIcon },
  { value: "security", label: "Login & Security", icon: Lock },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "privacy", label: "Privacy", icon: ShieldCheck },
  { value: "subscription", label: "Subscription", icon: CreditCard },
  { value: "payouts", label: "Payouts", icon: Wallet },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Section>("profile");

  return (
    <DashboardShell title="Settings" subtitle="Manage your account and preferences.">
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="surface-card p-2 h-max lg:sticky lg:top-24">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

        <div className="flex flex-col gap-4 min-w-0">
          {tab === "profile" ? <ProfileSection /> : null}
          {tab === "security" ? <LoginSecuritySection /> : null}
          {tab === "notifications" ? (
            <BasicCard title="Notifications" body="Choose what you get notified about.">
              <SettingRows>
                <Toggle label="New subscribers" defaultOn />
                <Toggle label="Tips" defaultOn />
                <Toggle label="Direct messages" defaultOn />
                <Toggle label="Weekly summary" />
                <Toggle label="Product updates" />
              </SettingRows>
            </BasicCard>
          ) : null}
          {tab === "privacy" ? (
            <BasicCard title="Privacy" body="Control who can see and message you.">
              <SettingRows>
                <Toggle label="Show subscriber count" defaultOn />
                <Toggle label="Allow messages from non-subscribers" />
                <Toggle label="Appear in explore" defaultOn />
              </SettingRows>
            </BasicCard>
          ) : null}
          {tab === "subscription" ? <SubscriptionSection /> : null}
          {tab === "payouts" ? <PayoutsSection /> : null}
        </div>
      </div>
    </DashboardShell>
  );
}

/* ─── Profile (includes socials) ───────────────────────────────────── */

function ProfileSection() {
  const { user, updateMe } = useAuth();
  const [form, setForm] = useState<UpdateMeIn>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      displayName: user.displayName ?? "",
      bio: user.bio ?? "",
      socials: {
        instagram: user.socials?.instagram ?? "",
        x: user.socials?.x ?? "",
        tiktok: user.socials?.tiktok ?? "",
        website: user.socials?.website ?? "",
      },
    });
  }, [user]);

  const set = <K extends keyof UpdateMeIn>(key: K, value: UpdateMeIn[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setSocial = (key: keyof UserSocials, value: string) =>
    setForm((f) => ({ ...f, socials: { ...(f.socials ?? {}), [key]: value } }));

  const socialsDirty = useMemo(() => {
    const server = user?.socials ?? {};
    const draft = form.socials ?? {};
    const keys: (keyof UserSocials)[] = ["instagram", "x", "tiktok", "website"];
    return keys.some(
      (k) => (draft[k] ?? "").trim() !== (server[k] ?? "").trim()
    );
  }, [form.socials, user?.socials]);

  const dirty = useMemo(() => {
    if (!user) return false;
    if ((form.displayName ?? "") !== (user.displayName ?? "")) return true;
    if ((form.bio ?? "") !== (user.bio ?? "")) return true;
    return socialsDirty;
  }, [form, user, socialsDirty]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const patch: UpdateMeIn = {};
      if ((form.displayName ?? "") !== (user?.displayName ?? ""))
        patch.displayName = form.displayName?.trim() || undefined;
      if ((form.bio ?? "") !== (user?.bio ?? ""))
        patch.bio = form.bio?.trim() || undefined;
      if (socialsDirty) {
        const draft = form.socials ?? {};
        patch.socials = {
          instagram: draft.instagram?.trim() || undefined,
          x: draft.x?.trim() || undefined,
          tiktok: draft.tiktok?.trim() || undefined,
          website: draft.website?.trim() || undefined,
        };
      }
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

  const displayName = form.displayName || user?.username || "You";

  return (
    <form onSubmit={submit}>
      <BasicCard title="Profile" body="This information appears on your public profile.">
        <div className="flex items-center gap-4">
          <Avatar
            name={displayName}
            gradient={BRAND_GRADIENT}
            image={user?.avatarUrl ?? undefined}
            size={72}
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm text-white/85 font-medium">@{user?.username}</span>
            <span className="text-xs text-white/50">
              Avatar &amp; cover upload lives in Onboarding for now.
            </span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Display name"
            value={form.displayName ?? ""}
            onChange={(e) => set("displayName", e.target.value)}
            maxLength={80}
          />
          <Input label="Username" defaultValue={user?.username ?? ""} readOnly />
        </div>
        <Textarea
          label={`Bio (${(form.bio ?? "").length}/500)`}
          value={form.bio ?? ""}
          onChange={(e) => set("bio", e.target.value.slice(0, 500))}
          placeholder="Tell fans a little about you…"
        />

        <div className="flex flex-col gap-3 pt-2">
          <SectionHead
            title="Socials"
            body="Links shown on your public profile. Enter your handle without the @ (or a full URL for Website)."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Instagram"
              placeholder="username"
              leftIcon={<InstagramIcon />}
              value={form.socials?.instagram ?? ""}
              onChange={(e) => setSocial("instagram", e.target.value)}
            />
            <Input
              label="X"
              placeholder="handle"
              leftIcon={<XIcon />}
              value={form.socials?.x ?? ""}
              onChange={(e) => setSocial("x", e.target.value)}
            />
            <Input
              label="TikTok"
              placeholder="handle"
              leftIcon={<TikTokIcon />}
              value={form.socials?.tiktok ?? ""}
              onChange={(e) => setSocial("tiktok", e.target.value)}
            />
            <Input
              label="Website"
              placeholder="https://…"
              leftIcon={<WebsiteIcon />}
              value={form.socials?.website ?? ""}
              onChange={(e) => setSocial("website", e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05]">
          <Button type="submit" disabled={!dirty || saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </BasicCard>
    </form>
  );
}

/* ─── Login & Security ─────────────────────────────────────────────── */

function LoginSecuritySection() {
  const router = useRouter();
  const { user, logout, deleteMe, refresh } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [twoFaMode, setTwoFaMode] = useState<"none" | "setup" | "disable">("none");

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      toast.success("Signed out");
    } catch {
      toast.error("Couldn't sign out");
      setLoggingOut(false);
      return;
    }
    window.location.href = "/login";
  };

  const twoFactorOn = !!user?.twoFactorEnabled;

  return (
    <div className="flex flex-col gap-4">
      {/* Credentials */}
      <BasicCard title="Login & Security" body="Manage your credentials.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email address" defaultValue={user?.email ?? ""} readOnly />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/70">Password</label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                readOnly
                value="•••••••••"
                className="flex-1 h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white px-4 outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPasswordOpen(true)}
              >
                Change password →
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.05]">
          <span className="text-sm font-medium text-white">Country blacklist</span>
          <span className="text-xs text-white/55">
            Restrict access by region — subscribers in these countries can&apos;t view your posts.
          </span>
          <CountryBlacklist />
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05]">
          <Button variant="secondary" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "Signing out…" : "Log out"}
          </Button>
        </div>
      </BasicCard>

      {/* 2FA */}
      <BasicCard
        title="Two-Factor Authentication"
        body="Add an extra layer of security to your account."
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center size-10 rounded-full bg-white/[0.06] text-white/70">
              <ShieldCheck className="size-4" />
            </span>
            <div className="flex flex-col">
              {twoFactorOn ? (
                <Badge variant="brand">Enabled</Badge>
              ) : (
                <Badge>Disabled</Badge>
              )}
              <span className="text-sm text-white/60 mt-2">
                {twoFactorOn
                  ? "You'll be asked for a 6-digit code at every login."
                  : "Enable 2FA to require a second verification step whenever you log in."}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant={twoFactorOn ? "secondary" : undefined}
            onClick={() => setTwoFaMode(twoFactorOn ? "disable" : "setup")}
          >
            {twoFactorOn ? "Disable 2FA" : "Set Up 2FA"}
          </Button>
        </div>
      </BasicCard>

      {passwordOpen ? (
        <ChangePasswordModal onClose={() => setPasswordOpen(false)} />
      ) : null}

      {twoFaMode === "setup" ? (
        <TwoFactorSetupModal
          onClose={() => setTwoFaMode("none")}
          onEnabled={async () => {
            await refresh();
            setTwoFaMode("none");
          }}
        />
      ) : null}

      {twoFaMode === "disable" ? (
        <TwoFactorDisableModal
          onClose={() => setTwoFaMode("none")}
          onDisabled={async () => {
            await refresh();
            setTwoFaMode("none");
          }}
        />
      ) : null}

      {/* Danger Zone */}
      <div className="surface-card p-4 sm:p-6 flex flex-col gap-4 border border-red-500/20 bg-red-500/[0.03]">
        <div>
          <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
          <p className="text-sm text-white/55 mt-1">Irreversible account actions.</p>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center justify-center size-10 rounded-full bg-red-500/15 text-red-300">
              <TriangleAlert className="size-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-white font-medium">Delete this account</span>
              <span className="text-sm text-white/60 mt-1 max-w-md">
                Permanently removes all your data. This cannot be undone.
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            className="!text-red-200 !bg-red-500/10 !border-red-500/30 hover:!bg-red-500/20"
            onClick={() => setConfirmDelete(true)}
            disabled={!user}
          >
            Delete account
          </Button>
        </div>
      </div>

      {confirmDelete && user ? (
        <DeleteAccountModal
          username={user.username}
          onClose={() => setConfirmDelete(false)}
          onDeleted={async () => {
            try {
              await deleteMe();
              toast.success("Your account has been deleted");
              router.replace("/goodbye");
            } catch (e) {
              const msg =
                e instanceof ApiError ? e.detail ?? e.message : "Couldn't delete account";
              toast.error(msg);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function CountryBlacklist() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [initial, setInitial] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, current] = await Promise.all([
          geo.countries(),
          creatorBlacklist.get(),
        ]);
        if (cancelled) return;
        setCountries(list);
        setSelected(current.codes ?? []);
        setInitial(current.codes ?? []);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) {
          if (e.status !== 404) toast.error(e.detail ?? "Couldn't load blacklist");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const codeToName = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of countries) m.set(c.code, c.name);
    return m;
  }, [countries]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return countries
      .filter(
        (c) =>
          !selected.includes(c.code) &&
          (c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [query, countries, selected]);

  const add = (code: string) => {
    setSelected((prev) => (prev.includes(code) ? prev : [...prev, code]));
    setQuery("");
  };

  const remove = (code: string) =>
    setSelected((prev) => prev.filter((x) => x !== code));

  const dirty = useMemo(() => {
    if (selected.length !== initial.length) return true;
    const s = new Set(initial);
    return selected.some((c) => !s.has(c));
  }, [selected, initial]);

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const res = await creatorBlacklist.set(selected);
      setInitial(res.codes ?? []);
      setSelected(res.codes ?? []);
      toast.success("Blacklist updated");
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.detail ?? e.message : "Couldn't save blacklist";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loading ? "Loading countries…" : "Search and select countries…"}
          disabled={loading}
          className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white px-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors disabled:opacity-60"
        />
        {suggestions.length > 0 ? (
          <div className="absolute top-full left-0 right-0 mt-1 z-10 surface-elev rounded-[12px] p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
            {suggestions.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => add(c.code)}
                className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] text-white/85 hover:bg-white/[0.06] hover:text-white transition-colors flex items-center justify-between gap-2"
              >
                <span>{c.name}</span>
                <span className="text-[11px] text-white/40 font-mono">{c.code}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {selected.length === 0 ? (
        <span className="text-[11px] text-white/45">No restrictions active</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full text-[12px] text-white/85 bg-white/[0.06] hairline"
            >
              {codeToName.get(code) ?? code}
              <button
                type="button"
                onClick={() => remove(code)}
                aria-label={`Remove ${codeToName.get(code) ?? code}`}
                className="inline-flex items-center justify-center size-4 rounded-full text-white/60 hover:text-white hover:bg-white/[0.1]"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div>
        <Button type="button" onClick={save} disabled={!dirty || saving || loading}>
          {saving ? "Saving…" : "Save blacklist"}
        </Button>
      </div>
    </div>
  );
}

function DeleteAccountModal({
  username,
  onClose,
  onDeleted,
}: {
  username: string;
  onClose: () => void;
  onDeleted: () => void | Promise<void>;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const match = typed.trim() === username;

  const confirm = async () => {
    if (!match || busy) return;
    setBusy(true);
    try {
      await onDeleted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />
      <div className="relative w-full max-w-md surface-card p-4 sm:p-6 flex flex-col gap-4">
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

/* ─── Payouts (real Nomba) ─────────────────────────────────────────── */

function PayoutsSection() {
  const { user, refresh } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolved, setResolved] = useState<ResolveAccountOut | null>(null);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const existing = user?.payoutAccount;

  useEffect(() => {
    (async () => {
      try {
        const list = await creatorPayout.banks();
        setBanks(list);
      } catch (e) {
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load bank list");
      } finally {
        setBanksLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setResolved(null);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!bankCode || accountNumber.length !== 10) return;
    debounceRef.current = window.setTimeout(async () => {
      setResolving(true);
      try {
        const r = await creatorPayout.resolve(bankCode, accountNumber);
        setResolved(r);
      } catch (e) {
        setResolved(null);
        if (e instanceof ApiError) {
          const msg =
            e.code === "invalid_account" || e.code === "invalid_account_number"
              ? "We couldn't verify that account. Double-check the number."
              : e.detail ?? "Account lookup failed";
          toast.error(msg);
        }
      } finally {
        setResolving(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [bankCode, accountNumber]);

  const submit = async () => {
    if (!resolved || saving) return;
    setSaving(true);
    try {
      await creatorPayout.saveAccount({
        bankCode: resolved.bankCode,
        accountNumber: resolved.accountNumber,
        accountName: resolved.accountName,
      });
      toast.success("Payout account saved");
      await refresh();
      setEditing(false);
      setBankCode("");
      setAccountNumber("");
      setResolved(null);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "unsupported_bank"
            ? "That bank isn't supported yet."
            : e.detail ?? "Couldn't save payout account"
          : "Couldn't save payout account";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Existing account view
  if (existing && !editing) {
    return (
      <BasicCard title="Payouts" body="Where your monthly payouts land.">
        <div className="rounded-[14px] hairline bg-white/[0.02] p-4 flex items-center gap-4">
          <span className="inline-flex items-center justify-center size-10 rounded-full bg-gradient-brand-soft text-white shrink-0">
            <Building2 className="size-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">
              {existing.accountName ?? "Account holder"}
            </div>
            <div className="text-xs text-white/60 mt-0.5 truncate">
              {existing.bankName ?? "Bank"} · {existing.accountNumberMasked}
            </div>
          </div>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Change
          </Button>
        </div>
        <div className="rounded-[12px] p-3 bg-white/[0.03] hairline text-xs text-white/55">
          Your payout details are encrypted and never shared with fans.
        </div>
      </BasicCard>
    );
  }

  return (
    <BasicCard
      title="Payouts"
      body="Add a bank account for monthly payouts. Powered by Nomba."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/70">Bank</label>
          <div className="relative">
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              disabled={banksLoading}
              className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white pl-4 pr-9 appearance-none outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors disabled:opacity-60"
            >
              <option value="" className="bg-[#141026]">
                {banksLoading ? "Loading banks…" : "Select a bank"}
              </option>
              {banks.map((b) => (
                <option key={b.code} value={b.code} className="bg-[#141026]">
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-white/50 pointer-events-none" />
          </div>
        </div>

        <Input
          label="Account number"
          placeholder="0123456789"
          inputMode="numeric"
          maxLength={10}
          value={accountNumber}
          onChange={(e) =>
            setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          rightIcon={
            resolving ? (
              <span
                aria-hidden
                className="inline-block size-4 rounded-full border-2 border-white/25 border-t-white/85 animate-spin"
              />
            ) : undefined
          }
        />
      </div>

      {resolved ? (
        <div className="rounded-[12px] hairline bg-gradient-brand-soft p-3 flex items-start gap-3">
          <span className="inline-flex items-center justify-center size-8 rounded-full bg-white/[0.1] text-green-300 shrink-0">
            <Check className="size-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm">
              Is this you?{" "}
              <span className="font-semibold">{resolved.accountName}</span>
            </div>
            <div className="text-white/60 text-xs mt-0.5">
              {resolved.bankName} · {resolved.accountNumber}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-[12px] p-3 bg-white/[0.03] hairline text-xs text-white/55">
        Your payout details are encrypted and never shared with fans.
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
        <Button onClick={submit} disabled={!resolved || saving}>
          {saving ? "Saving…" : existing ? "Save changes" : "Save account"}
        </Button>
        {editing ? (
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setBankCode("");
              setAccountNumber("");
              setResolved(null);
            }}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </BasicCard>
  );
}

/* ─── Shared ──────────────────────────────────────────────────────── */

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
    <div className="surface-card p-4 sm:p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/55 mt-1">{body}</p>
      </div>
      {children}
    </div>
  );
}

function SectionHead({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-white/55 mt-0.5">{body}</p>
    </div>
  );
}

function FormFieldSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-3 w-20 rounded-full" />
      <Skeleton className="h-11 w-full rounded-[12px]" />
    </div>
  );
}

function SettingRows({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col [&>*]:border-t [&>*]:border-white/[0.05] [&>*:first-child]:border-t-0">
      {children}
    </div>
  );
}

/* ─── Subscription pricing ────────────────────────────────────────── */

const MAX_NAIRA = 50_000;
const MAX_KOBO = MAX_NAIRA * 100;

const ALL_MONTHS: SubscriptionMonths[] = [1, 2, 3];

function SubscriptionSection() {
  const [pricing, setPricing] = useState<SubscriptionPricingOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [baseNaira, setBaseNaira] = useState<string>("");
  const [discountPct, setDiscountPct] = useState<string>("0");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<SubscriptionMonths[]>(
    ALL_MONTHS
  );
  const [monthsError, setMonthsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await creatorSubscription.get();
      applyServerState(p);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyServerState = (p: SubscriptionPricingOut) => {
    setPricing(p);
    setBaseNaira(String(Math.round(p.monthlyPriceKobo / 100)));
    setDiscountPct(String(p.discountPct ?? 0));
    setExpiryDate(
      p.discountExpiresAt
        ? new Date(p.discountExpiresAt).toISOString().slice(0, 10)
        : ""
    );
    setAvailableMonths(
      p.availableMonths && p.availableMonths.length > 0
        ? [...p.availableMonths].sort((a, b) => a - b)
        : ALL_MONTHS
    );
    setMonthsError(null);
  };

  const toggleMonth = (m: SubscriptionMonths) => {
    setMonthsError(null);
    setAvailableMonths((prev) =>
      prev.includes(m)
        ? prev.filter((x) => x !== m)
        : ([...prev, m].sort((a, b) => a - b) as SubscriptionMonths[])
    );
  };

  useEffect(() => {
    load();
  }, [load]);

  const baseNum = Number(baseNaira);
  const pctNum = Number(discountPct);
  const baseKobo = Math.round((Number.isFinite(baseNum) ? baseNum : 0) * 100);
  const validBase = Number.isFinite(baseNum) && baseNum >= 1 && baseNum <= MAX_NAIRA;
  const validPct =
    Number.isFinite(pctNum) && pctNum >= 0 && pctNum <= 100 && Number.isInteger(pctNum);
  const expiryDateObj = expiryDate ? new Date(`${expiryDate}T23:59:59`) : null;
  const validExpiry = !expiryDateObj || expiryDateObj.getTime() > Date.now();
  const validMonths = availableMonths.length > 0;
  const canSave =
    validBase && validPct && validExpiry && validMonths && !saving && !loading;

  const preview = useMemo(() => {
    return availableMonths.map((months) => {
      const gross = baseKobo * months;
      const discountKobo = Math.round((gross * (validPct ? pctNum : 0)) / 100);
      const priceKobo = gross - discountKobo;
      return { months, gross, discountKobo, priceKobo };
    });
  }, [availableMonths, baseKobo, pctNum, validPct]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const patch: {
        monthlyPriceKobo: number;
        discountPct?: number;
        discountExpiresAt?: string | null;
        availableMonths?: SubscriptionMonths[];
      } = {
        monthlyPriceKobo: Math.min(baseKobo, MAX_KOBO),
      };
      patch.discountPct = pctNum;
      if (expiryDate) {
        patch.discountExpiresAt = new Date(`${expiryDate}T23:59:59`).toISOString();
      } else if (pricing?.discountExpiresAt) {
        patch.discountExpiresAt = null;
      }
      patch.availableMonths = availableMonths;
      const res = await creatorSubscription.update(patch);
      applyServerState(res);
      toast.success("Subscription updated");
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.code === "invalid_available_months"
      ) {
        setMonthsError("Select at least one duration.");
        toast.error("Select at least one duration.");
      } else {
        const msg =
          e instanceof ApiError
            ? e.code === "validation_error"
              ? "Check the values and try again."
              : e.code === "identity_required"
              ? "Get identity-verified to charge for subscriptions."
              : e.detail ?? e.message
            : "Couldn't save subscription";
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const discountLive = validPct && pctNum > 0;
  const active = pricing?.discountActive ?? false;

  return (
    <div className="surface-card p-4 sm:p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Create subscription</h2>
        <p className="text-sm text-white/55 mt-1">
          Set your base monthly price. Add an optional discount that applies to all
          three durations. Fans can subscribe for 1, 2, or 3 months.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-5" aria-busy>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldSkeleton />
            <FormFieldSkeleton />
          </div>
          <Skeleton className="h-24 w-full rounded-[14px]" />
          <Skeleton className="h-10 w-32 rounded-full" />
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

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-white/70">
              Which plans do you want to offer?
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_MONTHS.map((m) => {
                const on = availableMonths.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMonth(m)}
                    aria-pressed={on}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-medium transition-colors",
                      on
                        ? "bg-gradient-brand text-white on-media shadow-[0_6px_20px_-6px_rgba(253,35,167,0.5)]"
                        : "bg-white/[0.04] hairline text-white/70 hover:bg-white/[0.08]"
                    )}
                  >
                    {on ? <Check className="size-3.5" /> : null}
                    {m === 1 ? "1-month" : `${m}-months`}
                  </button>
                );
              })}
            </div>
            <span
              className={cn(
                "text-[11px]",
                monthsError || !validMonths ? "text-red-300" : "text-white/45"
              )}
            >
              {monthsError ??
                (validMonths
                  ? "Fans will only see the durations you tick here."
                  : "Select at least one duration.")}
            </span>
          </div>

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

/* ─── Change password / 2FA modals ────────────────────────────────── */

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const canSubmit =
    current.length > 0 &&
    next.length >= 8 &&
    next === confirm &&
    next !== current &&
    !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      await usersApi.changePassword({ currentPassword: current, newPassword: next });
      toast.success("Password updated");
      onClose();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "invalid_credentials"
            ? "Current password is incorrect."
            : e.code === "weak_password"
            ? "New password is too weak. Try a longer mix."
            : e.code === "rate_limited"
            ? "Too many attempts. Try again in a moment."
            : e.detail ?? e.message
          : "Couldn't change password";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const sendResetEmail = async () => {
    if (!user?.email || sendingReset) return;
    setSendingReset(true);
    try {
      await auth.forgotPassword({ email: user.email });
      toast.success(`Reset link sent to ${user.email}`);
      onClose();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "rate_limited"
            ? "Too many attempts. Try again in a moment."
            : e.detail ?? e.message
          : "Couldn't send reset email";
      toast.error(msg);
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <ModalShell onClose={busy || sendingReset ? undefined : onClose}>
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center size-10 rounded-full bg-white/[0.06] text-white/70 shrink-0">
          <Lock className="size-4" />
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Change password</h3>
          <p className="text-sm text-white/60 mt-1">
            Enter your current password, then choose a new one (at least 8 characters).
          </p>
        </div>
      </div>

      <form className="flex flex-col gap-3" onSubmit={submit}>
        <div className="flex flex-col gap-1.5">
          <Input
            type="password"
            label="Current password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
          <button
            type="button"
            onClick={sendResetEmail}
            disabled={!user?.email || sendingReset || busy}
            className="self-start text-[12px] text-[#FD5CC9] hover:text-white underline underline-offset-4 decoration-[#FD23A7]/50 disabled:opacity-50 disabled:no-underline"
          >
            {sendingReset ? "Sending reset link…" : "Forgot current password?"}
          </button>
        </div>
        <Input
          type="password"
          label="New password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <Input
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {next && confirm && next !== confirm ? (
          <span className="text-xs text-red-300">Passwords don&apos;t match.</span>
        ) : null}
        {next && next === current ? (
          <span className="text-xs text-red-300">New password must differ from current.</span>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy || sendingReset}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {busy ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function TwoFactorSetupModal({
  onClose,
  onEnabled,
}: {
  onClose: () => void;
  onEnabled: () => void | Promise<void>;
}) {
  const [step, setStep] = useState<"loading" | "scan" | "codes">("loading");
  const [data, setData] = useState<TwoFactorSetupOut | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await twoFactor.setup();
        if (cancelled) return;
        setData(res);
        setStep("scan");
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof ApiError ? e.detail ?? e.message : "Couldn't start 2FA setup";
        toast.error(msg);
        onClose();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onClose]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || busy) return;
    setBusy(true);
    try {
      const res = await twoFactor.enable({ code });
      setBackupCodes(res.backupCodes ?? []);
      setStep("codes");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "invalid_totp" || e.code === "invalid_otp"
            ? "That code didn't match. Try again."
            : e.detail ?? e.message
          : "Couldn't verify code";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const copyBackup = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const finish = async () => {
    await onEnabled();
    toast.success("Two-factor authentication enabled");
  };

  return (
    <ModalShell onClose={busy ? undefined : onClose} wide>
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center size-10 rounded-full bg-white/[0.06] text-white/70 shrink-0">
          <ShieldCheck className="size-4" />
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">
            {step === "codes" ? "Save your backup codes" : "Set up two-factor authentication"}
          </h3>
          <p className="text-sm text-white/60 mt-1">
            {step === "codes"
              ? "Store these somewhere safe — each one works once if you lose access to your authenticator."
              : "Scan the QR code with an authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code below."}
          </p>
        </div>
      </div>

      {step === "loading" || !data ? (
        <div className="py-10 flex items-center justify-center">
          <span className="size-6 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
        </div>
      ) : step === "scan" ? (
        <form className="flex flex-col gap-4" onSubmit={verify}>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="shrink-0 rounded-[12px] bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.qrCodeUrl}
                alt="2FA QR code"
                className="size-40 block"
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <span className="text-xs text-white/55">Or enter this secret manually:</span>
              <code className="block break-all rounded-[10px] hairline bg-white/[0.04] px-3 py-2 text-[12px] text-white/85 font-mono">
                {data.secret}
              </code>
            </div>
          </div>

          <Input
            label="6-digit code"
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={code.length < 6 || busy}>
              {busy ? "Verifying…" : "Verify & enable"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-[12px] hairline bg-white/[0.03] p-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[13px] text-white/90">
              {backupCodes.map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="secondary" onClick={copyBackup}>
              {copied ? "Copied!" : "Copy all"}
            </Button>
            <Button type="button" onClick={finish}>
              Done
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function TwoFactorDisableModal({
  onClose,
  onDisabled,
}: {
  onClose: () => void;
  onDisabled: () => void | Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6 || busy) return;
    setBusy(true);
    try {
      await twoFactor.disable({ code });
      await onDisabled();
      toast.success("Two-factor authentication disabled");
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.code === "invalid_totp" || e.code === "invalid_otp"
            ? "That code didn't match. Try again."
            : e.detail ?? e.message
          : "Couldn't disable 2FA";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell onClose={busy ? undefined : onClose}>
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center size-10 rounded-full bg-red-500/15 text-red-300 shrink-0">
          <TriangleAlert className="size-4" />
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">Disable 2FA</h3>
          <p className="text-sm text-white/60 mt-1">
            Enter a code from your authenticator app or a backup code to turn off 2FA.
          </p>
        </div>
      </div>

      <form className="flex flex-col gap-3" onSubmit={submit}>
        <Input
          label="Verification code"
          placeholder="123456"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\s/g, "").slice(0, 12))}
          autoFocus
        />

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="!bg-red-500 !text-white hover:!bg-red-500/90"
            disabled={code.length < 6 || busy}
          >
            {busy ? "Disabling…" : "Disable 2FA"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  children,
  onClose,
  wide,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full surface-card p-4 sm:p-6 flex flex-col gap-4",
          wide ? "max-w-lg" : "max-w-md"
        )}
      >
        {children}
      </div>
    </div>
  );
}
