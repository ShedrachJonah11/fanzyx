"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  ChevronDown,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input, Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/services/context";
import { ApiError } from "@/services/apiClient";
import { uploadImage } from "@/services/modules/uploads";
import { creatorPayout, creatorOnboarding } from "@/services/modules/creator";
import type { Bank, ResolveAccountOut } from "@/services/dtos";
import { cn } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";
const COVER_GRADIENT =
  "linear-gradient(120deg, rgba(105,41,252,0.55), rgba(253,35,167,0.4))";

const errorMessage = (e: unknown, fallback = "Something went wrong."): string => {
  if (e instanceof ApiError) return e.detail ?? e.message ?? fallback;
  if (e instanceof Error) return e.message;
  return fallback;
};

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const { user, loading, logout, updateMe, refresh } = useAuth();

  // Route guards driven by /me
  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== "creator") router.replace("/feed");
    else if (user.onboardingCompletedAt) router.replace("/dashboard");
  }, [loading, user, router]);

  const needsAgeGate = user?.is18 === false;
  const hasPayout = !!user?.payoutAccount;

  const steps = useMemo(
    () =>
      needsAgeGate
        ? [
            { id: 1, title: "Profile", icon: UserRound },
            { id: 2, title: "Payouts", icon: Building2 },
            { id: 3, title: "Verify age", icon: ShieldCheck },
            { id: 4, title: "Finish", icon: Check },
          ]
        : [
            { id: 1, title: "Profile", icon: UserRound },
            { id: 2, title: "Payouts", icon: Building2 },
            { id: 3, title: "Finish", icon: Check },
          ],
    [needsAgeGate]
  );

  const totalSteps = steps.length;
  const ageStep = needsAgeGate ? totalSteps - 1 : null;
  const finishStep = totalSteps;

  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(totalSteps, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const declineAge = async () => {
    try {
      await logout();
    } catch {
      // ignore — still redirect
    }
    router.replace("/goodbye-under-18");
  };

  if (loading || !user || user.role !== "creator" || user.onboardingCompletedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070A]">
        <span className="size-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070A] flex flex-col">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <Link href="/dashboard" className="text-xs text-white/55 hover:text-white">
            Skip for now
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-8">
        {/* Stepper */}
        <ol className="flex items-center gap-2 sm:gap-4 mb-8 overflow-x-auto">
          {steps.map((s, i) => {
            const active = s.id === step;
            const done = s.id < step;
            return (
              <li key={s.id} className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-8 rounded-full inline-flex items-center justify-center text-xs font-medium transition-colors",
                      active && "bg-gradient-brand text-white",
                      done && "bg-white/10 text-white",
                      !active && !done && "bg-white/[0.04] text-white/50 hairline"
                    )}
                  >
                    {done ? <Check className="size-4" /> : s.id}
                  </span>
                  <span
                    className={cn(
                      "text-xs sm:text-sm whitespace-nowrap",
                      active ? "text-white font-medium" : "text-white/55"
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {i < steps.length - 1 ? (
                  <span className="w-6 sm:w-10 h-px bg-white/[0.08]" />
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="surface-card p-6 sm:p-8">
          {step === 1 ? (
            <ProfileStep onDone={next} />
          ) : null}

          {step === 2 ? (
            <PayoutStep onDone={next} />
          ) : null}

          {ageStep !== null && step === ageStep ? (
            <AgeStep
              onConfirm={async () => {
                try {
                  await updateMe({ is18: true });
                  toast.success("Age confirmed");
                  next();
                } catch (e) {
                  toast.error(errorMessage(e, "Couldn't confirm age"));
                }
              }}
              onDecline={declineAge}
            />
          ) : null}

          {step === finishStep ? (
            <FinishStep
              hasPayout={hasPayout}
              ageOk={!needsAgeGate}
              onComplete={async () => {
                try {
                  await creatorOnboarding.complete();
                  toast.success("You're all set");
                  await refresh();
                  router.replace("/dashboard");
                } catch (e) {
                  const msg =
                    e instanceof ApiError && e.code === "payout_missing"
                      ? "Add a payout account first."
                      : e instanceof ApiError && e.code === "age_required"
                      ? "Confirm you're 18+ first."
                      : errorMessage(e, "Couldn't finish onboarding");
                  toast.error(msg);
                }
              }}
            />
          ) : null}

          {step !== finishStep && step !== 1 && step !== 2 && step !== ageStep ? null : null}

          {step !== finishStep ? (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.05]">
              <Button
                variant="ghost"
                onClick={prev}
                disabled={step === 1}
                leftIcon={<ArrowLeft />}
              >
                Back
              </Button>
              {/* The active step's own submit button lives inside each StepXxx */}
              <span />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1: Profile ─────────────────────────────────────────────── */

function ProfileStep({ onDone }: { onDone: () => void }) {
  const { user, updateMe } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(user?.coverUrl ?? "");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty =
    (displayName ?? "") !== (user?.displayName ?? "") ||
    (username ?? "") !== (user?.username ?? "") ||
    (bio ?? "") !== (user?.bio ?? "") ||
    (avatarUrl ?? "") !== (user?.avatarUrl ?? "") ||
    (coverUrl ?? "") !== (user?.coverUrl ?? "");

  const canContinue =
    username.trim().length >= 3 && displayName.trim().length > 0;

  const handleAvatarPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarBusy(true);
    try {
      const url = await uploadImage(file, "avatar");
      setAvatarUrl(url);
      toast.success("Avatar uploaded");
    } catch (err) {
      toast.error(errorMessage(err, "Avatar upload failed"));
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleCoverPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverBusy(true);
    try {
      const url = await uploadImage(file, "cover");
      setCoverUrl(url);
      toast.success("Cover uploaded");
    } catch (err) {
      toast.error(errorMessage(err, "Cover upload failed"));
    } finally {
      setCoverBusy(false);
    }
  };

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (dirty) {
        const patch: Record<string, unknown> = {};
        if ((displayName ?? "") !== (user?.displayName ?? ""))
          patch.displayName = displayName.trim();
        if ((username ?? "") !== (user?.username ?? ""))
          patch.username = username.trim().toLowerCase();
        if ((bio ?? "") !== (user?.bio ?? "")) patch.bio = bio.trim();
        if ((avatarUrl ?? "") !== (user?.avatarUrl ?? ""))
          patch.avatarUrl = avatarUrl || undefined;
        if ((coverUrl ?? "") !== (user?.coverUrl ?? ""))
          patch.coverUrl = coverUrl || undefined;
        await updateMe(patch);
      }
      onDone();
    } catch (e) {
      const msg =
        e instanceof ApiError && e.code === "username_taken"
          ? "That username is taken. Try another."
          : errorMessage(e, "Couldn't save profile");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        title="Set up your profile"
        body="Your name, avatar, cover, and a short bio to introduce you to fans."
      />

      <div className="flex items-center gap-5 flex-wrap">
        <div className="relative">
          <Avatar
            name={displayName || username || "You"}
            gradient={BRAND_GRADIENT}
            image={avatarUrl || undefined}
            size={88}
          />
          <label
            htmlFor="avatar-upload"
            className={cn(
              "absolute -bottom-1 -right-1 size-8 rounded-full bg-white text-black inline-flex items-center justify-center shadow-lg cursor-pointer",
              avatarBusy && "opacity-70 pointer-events-none"
            )}
            aria-label="Change avatar"
            title="Change avatar"
          >
            {avatarBusy ? <MiniSpinner dark /> : <Camera className="size-4" />}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarPick}
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <div
            className="h-24 rounded-[16px] hairline relative overflow-hidden bg-cover bg-center"
            style={{
              backgroundImage: coverUrl ? `url(${coverUrl})` : COVER_GRADIENT,
            }}
          >
            <label
              htmlFor="cover-upload"
              className={cn(
                "absolute right-3 bottom-3 h-9 px-3.5 rounded-full bg-white/90 text-black text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer",
                coverBusy && "opacity-70 pointer-events-none"
              )}
            >
              {coverBusy ? <MiniSpinner dark /> : <Camera className="size-3.5" />}
              {coverBusy ? "Uploading…" : "Change cover"}
            </label>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverPick}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Display name"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value.slice(0, 80))}
        />
        <Input
          label="Username"
          placeholder="username"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30)
            )
          }
          hint="3–30 chars · lowercase letters, digits, underscore"
        />
      </div>

      <Textarea
        label={`Bio (${bio.length}/500)`}
        placeholder="What kind of content do you create?"
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, 500))}
      />

      <div className="flex justify-end">
        <Button
          onClick={submit}
          rightIcon={<ArrowRight />}
          disabled={!canContinue || saving}
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 2: Payout ──────────────────────────────────────────────── */

function PayoutStep({ onDone }: { onDone: () => void }) {
  const { refresh } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolved, setResolved] = useState<ResolveAccountOut | null>(null);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await creatorPayout.banks();
        setBanks(list);
      } catch (e) {
        toast.error(errorMessage(e, "Couldn't load bank list"));
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
          if (e.code === "invalid_account" || e.code === "invalid_account_number") {
            toast.error("We couldn't verify that account. Double-check the number.");
          } else {
            toast.error(errorMessage(e, "Account lookup failed"));
          }
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
      onDone();
    } catch (e) {
      const msg =
        e instanceof ApiError && e.code === "unsupported_bank"
          ? "That bank isn't supported yet."
          : errorMessage(e, "Couldn't save payout account");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        title="Where should we send your money?"
        body="Add a bank account for monthly payouts. You can update this later."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 w-full">
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
          rightIcon={resolving ? <MiniSpinner /> : undefined}
        />
      </div>

      {resolved ? (
        <div className="rounded-[12px] hairline bg-gradient-brand-soft p-4 flex items-start gap-3">
          <span className="inline-flex items-center justify-center size-9 rounded-full bg-white/[0.1] text-green-300 shrink-0">
            <Check className="size-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm">
              Is this you? <span className="font-semibold">{resolved.accountName}</span>
            </div>
            <div className="text-white/60 text-xs mt-0.5">
              {resolved.bankName} · {resolved.accountNumber}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-[12px] p-4 bg-white/[0.03] hairline text-xs text-white/60">
        Your payout details are encrypted and never shared with fans.
      </div>

      <div className="flex justify-end">
        <Button
          onClick={submit}
          rightIcon={<ArrowRight />}
          disabled={!resolved || saving}
        >
          {saving ? "Saving…" : "Save & continue"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 3: Verify age ──────────────────────────────────────────── */

function AgeStep({
  onConfirm,
  onDecline,
}: {
  onConfirm: () => Promise<void> | void;
  onDecline: () => Promise<void> | void;
}) {
  const [age18, setAge18] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!age18 || busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-3">
        <span className="inline-flex items-center justify-center size-12 rounded-full bg-gradient-brand-soft border border-white/10">
          <ShieldCheck className="size-5 text-white" />
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            You must be 18 or older to use FanzyX
          </h2>
          <p className="text-sm text-white/55 mt-1 max-w-md">
            Please confirm your age before you start publishing.
          </p>
        </div>
      </div>

      <div className="rounded-[12px] hairline bg-white/[0.02] p-4">
        <Checkbox
          checked={age18}
          onChange={setAge18}
          label={
            <>
              I confirm that I am 18 years of age or older and legally permitted to
              access and upload adult content on FanzyX.
            </>
          }
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-end">
        <Button variant="ghost" onClick={onDecline} disabled={busy}>
          I am not 18
        </Button>
        <Button
          onClick={confirm}
          disabled={!age18 || busy}
          rightIcon={<ArrowRight />}
        >
          {busy ? "Confirming…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Finish ──────────────────────────────────────────────────────── */

function FinishStep({
  hasPayout,
  ageOk,
  onComplete,
}: {
  hasPayout: boolean;
  ageOk: boolean;
  onComplete: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);
  const canComplete = hasPayout && ageOk;

  const submit = async () => {
    if (!canComplete || busy) return;
    setBusy(true);
    try {
      await onComplete();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center gap-4 py-6">
      <div className="size-16 rounded-full bg-gradient-brand flex items-center justify-center shadow-[0_15px_50px_-10px_rgba(105,41,252,0.7)]">
        <Check className="size-6 text-white" />
      </div>
      <h2 className="text-2xl font-semibold text-white">You&apos;re almost there</h2>
      <p className="text-white/60 max-w-md">
        {canComplete
          ? "Finish setup to publish your first post and start growing your audience."
          : hasPayout
          ? "Confirm your age above to finish."
          : "Add a payout account above to finish."}
      </p>
      <div className="flex gap-2 mt-2">
        <Button onClick={submit} size="lg" disabled={!canComplete || busy}>
          {busy ? "Finishing…" : "Finish setup"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Shared ──────────────────────────────────────────────────────── */

function StepHeader({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
        {title}
      </h2>
      <p className="text-sm text-white/55 mt-1">{body}</p>
    </div>
  );
}

function MiniSpinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-4 rounded-full border-2 animate-spin",
        dark
          ? "border-black/20 border-t-black/70"
          : "border-white/25 border-t-white/85"
      )}
    />
  );
}
