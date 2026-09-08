"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  AtSign,
  Camera,
  Check,
  ChevronLeft,
  Gift,
  IdCard,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LegalBlock } from "@/app/(auth)/signup/fan/page";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/services/context";
import { auth as authApi } from "@/services/modules";
import { ApiError } from "@/services/apiClient";
import { postAuthRoute } from "@/services/postAuthRoute";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Account" },
  { id: 2, label: "Verify" },
  { id: 3, label: "Password" },
  { id: 4, label: "Identity" },
] as const;

const CREATOR_ERROR: Record<string, string> = {
  username_taken: "That username is already taken.",
  email_taken: "An account already exists for this email.",
  invalid_otp: "That code isn't right. Try again.",
  flow_expired: "This signup session expired. Start over.",
  weak_password: "Password is too weak. Use 8+ characters with a mix.",
  age_required: "You must confirm you are 18 or older.",
  rate_limited: "Too many attempts. Try again in a moment.",
};

function readError(err: unknown, fallback = "Something went wrong."): string {
  if (err instanceof ApiError) return CREATOR_ERROR[err.code] ?? err.detail ?? err.message;
  return fallback;
}

function toastError(err: unknown) {
  toast.error(readError(err));
}

export default function CreatorSignupPage() {
  const router = useRouter();
  const {
    signupCreatorStart,
    signupCreatorVerify,
    signupCreatorPassword,
    user,
  } = useAuth();

  const [step, setStep] = useState(1);
  const [flowId, setFlowId] = useState<string | null>(null);

  // Step 1 state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referral, setReferral] = useState("");
  const [age18, setAge18] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);

  // Step 2 state — email OTP
  const [emailOtp, setEmailOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [emailVerified, setEmailVerified] = useState(false);

  // Step 3 state
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [busy, setBusy] = useState(false);

  const goStep = (n: number) => setStep(n);

  const submitAccount = async () => {
    setBusy(true);
    try {
      const res = await signupCreatorStart({
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        referralCode: referral.trim() || undefined,
      });
      setFlowId(res.flowId);
      toast.success(`Code sent to ${email.trim()}`);
      goStep(2);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (code: string) => {
    if (!flowId) return false;
    try {
      await signupCreatorVerify({ flowId, code });
      setEmailVerified(true);
      toast.success("Email verified");
      goStep(3);
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  };

  const submitPassword = async () => {
    if (!flowId) return;
    setBusy(true);
    try {
      await signupCreatorPassword({ flowId, password });
      toast.success("Account created");
      goStep(4);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const finishSignup = () => {
    router.replace(user ? postAuthRoute(user) : "/onboarding/creator");
  };

  const submitIdentity = async (idDoc: File | null, selfie: File | null) => {
    if (!idDoc && !selfie) {
      finishSignup();
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      if (idDoc) form.append("id_doc", idDoc);
      if (selfie) form.append("selfie", selfie);
      if (flowId) form.append("flowId", flowId);
      await authApi.signupCreatorIdentity(form);
      toast.success("Identity submitted for review");
      finishSignup();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const resendOtp = useCallback(async () => {
    if (!flowId) return;
    try {
      await authApi.resendOtp({ flowId, channel: "email" });
      toast.success("New code sent");
    } catch (err) {
      toastError(err);
    }
  }, [flowId]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/signup"
        className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white -mb-1 w-max"
      >
        <ChevronLeft className="size-3.5" /> Change signup type
      </Link>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">
          Create your creator account
        </h1>
        {step > 1 ? (
          <p className="text-sm text-white/55">
            Step {step} of 4 · {STEPS[step - 1].label}
          </p>
        ) : null}
      </div>

      {step > 1 ? <Stepper current={step} /> : null}

      {step === 1 ? (
        <>
          <GoogleSignInButton
            role="creator"
            next="/onboarding/creator"
            label="Continue with Google"
          />
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/40">
            <div className="flex-1 divider" /> or <div className="flex-1 divider" />
          </div>
          <StepAccount
            username={username}
            setUsername={setUsername}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            referral={referral}
            setReferral={setReferral}
            age18={age18}
            setAge18={setAge18}
            emailOptIn={emailOptIn}
            setEmailOptIn={setEmailOptIn}
            busy={busy}
            onContinue={submitAccount}
          />
        </>
      ) : null}

      {step === 2 ? (
        <StepVerify
          email={email || "your email"}
          emailOtp={emailOtp}
          setEmailOtp={setEmailOtp}
          emailVerified={emailVerified}
          onVerify={verifyOtp}
          onResend={resendOtp}
          onBack={() => goStep(1)}
        />
      ) : null}

      {step === 3 ? (
        <StepPassword
          password={password}
          setPassword={setPassword}
          confirm={confirm}
          setConfirm={setConfirm}
          busy={busy}
          onBack={() => goStep(2)}
          onContinue={submitPassword}
        />
      ) : null}

      {step === 4 ? <StepIdentity busy={busy} onSubmit={submitIdentity} onBack={() => goStep(3)} /> : null}

      <p className="text-sm text-white/55 text-center">
        Have an account?{" "}
        <Link href="/login" className="text-white hover:underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = s.id < current;
        const active = s.id === current;
        return (
          <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
            <span
              className={cn(
                "size-7 shrink-0 rounded-full inline-flex items-center justify-center text-[11px] font-semibold transition-all",
                active && "bg-gradient-brand text-white ring-4 ring-[#6929FC]/15",
                done && "bg-white/15 text-white",
                !active && !done && "bg-white/[0.04] text-white/45 hairline"
              )}
            >
              {done ? <Check className="size-3.5" /> : s.id}
            </span>
            {i < STEPS.length - 1 ? (
              <span
                className={cn(
                  "h-px flex-1 transition-colors",
                  done ? "bg-white/25" : "bg-white/[0.08]"
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function StepAccount({
  username,
  setUsername,
  email,
  setEmail,
  phone,
  setPhone,
  referral,
  setReferral,
  age18,
  setAge18,
  emailOptIn,
  setEmailOptIn,
  busy,
  onContinue,
}: {
  username: string;
  setUsername: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  referral: string;
  setReferral: (v: string) => void;
  age18: boolean;
  setAge18: (v: boolean) => void;
  emailOptIn: boolean;
  setEmailOptIn: (v: boolean) => void;
  busy: boolean;
  onContinue: () => void;
}) {
  const valid =
    username.trim().length >= 3 &&
    /\S+@\S+\.\S+/.test(email) &&
    phone.trim().length >= 7 &&
    age18;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onContinue();
      }}
    >
      <Input label="Username" placeholder="alexokafor" value={username} onChange={(e) => setUsername(e.target.value)} leftIcon={<AtSign />} autoComplete="username" />
      <Input type="email" label="Email" placeholder="you@fanzyx.app" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail />} autoComplete="email" />
      <Input type="tel" label="Phone number" placeholder="+234 800 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} leftIcon={<Phone />} autoComplete="tel" />
      <Input label="Referral code (optional)" placeholder="Enter code" value={referral} onChange={(e) => setReferral(e.target.value)} leftIcon={<Gift />} />

      <LegalBlock
        age18={age18}
        setAge18={setAge18}
        emailOptIn={emailOptIn}
        setEmailOptIn={setEmailOptIn}
        variant="creator"
      />

      <Button size="lg" className="w-full" disabled={!valid || busy}>
        {busy ? "Sending code…" : "Send verification code"}
      </Button>
    </form>
  );
}

function OtpInput({
  value,
  setValue,
  disabled,
  onComplete,
}: {
  value: string[];
  setValue: (v: string[]) => void;
  disabled?: boolean;
  onComplete?: (code: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const fireIfComplete = (arr: string[]) => {
    if (!onComplete) return;
    const filled = arr.every((d) => d.length === 1);
    if (filled) onComplete(arr.join(""));
  };

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[i] = digit;
    setValue(next);
    if (digit && i < value.length - 1) refs.current[i + 1]?.focus();
    if (digit) fireIfComplete(next);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, value.length);
    if (!text) return;
    e.preventDefault();
    const next = [...value];
    for (let i = 0; i < value.length; i++) next[i] = text[i] ?? "";
    setValue(next);
    refs.current[Math.min(text.length, value.length - 1)]?.focus();
    fireIfComplete(next);
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {value.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          className="w-11 h-12 rounded-[12px] bg-white/[0.04] hairline text-center text-lg font-semibold text-white outline-none focus:border-white/30 focus:bg-white/[0.06] transition-colors disabled:opacity-60"
        />
      ))}
    </div>
  );
}

function StepVerify({
  email,
  emailOtp,
  setEmailOtp,
  emailVerified,
  onVerify,
  onResend,
  onBack,
}: {
  email: string;
  emailOtp: string[];
  setEmailOtp: (v: string[]) => void;
  emailVerified: boolean;
  onVerify: (code: string) => Promise<boolean>;
  onResend: () => Promise<void>;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const submit = async (code: string) => {
    if (code.length !== 6 || busy || emailVerified) return;
    setBusy(true);
    await onVerify(code);
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-3">
        <span className="inline-flex items-center justify-center size-12 rounded-full bg-gradient-brand-soft border border-white/10">
          <ShieldCheck className="size-5 text-white" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">Verify it&apos;s you</h2>
          <p className="text-sm text-white/55 mt-1">
            We sent a 6-digit code to <span className="text-white/80">{email}</span>.
          </p>
        </div>
      </div>

      <OtpCard
        label={`Email code · sent to ${email}`}
        verified={emailVerified}
        value={emailOtp}
        setValue={setEmailOtp}
        onVerify={submit}
        onResend={onResend}
        busy={busy}
        disabled={emailVerified}
      />

      <Button variant="secondary" size="lg" onClick={onBack} type="button" leftIcon={<ArrowLeft />}>
        Back
      </Button>
    </div>
  );
}

function OtpCard({
  label,
  verified,
  value,
  setValue,
  onVerify,
  onResend,
  busy,
  disabled,
}: {
  label: string;
  verified: boolean;
  value: string[];
  setValue: (v: string[]) => void;
  onVerify: (code: string) => void;
  onResend: () => Promise<void>;
  busy: boolean;
  disabled?: boolean;
}) {
  const complete = value.every((d) => d.length === 1);
  return (
    <div className="rounded-[14px] hairline bg-white/[0.02] p-4 flex flex-col gap-3">
      <span className="text-xs text-white/60">{label}</span>
      <OtpInput
        value={value}
        setValue={setValue}
        disabled={disabled || busy}
        onComplete={(code) => {
          if (!verified && !busy) onVerify(code);
        }}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-[11px] text-white/60 hover:text-white"
          onClick={onResend}
          disabled={verified}
        >
          Resend
        </button>
        <div className="flex-1" />
        <Button
          size="md"
          onClick={() => onVerify(value.join(""))}
          disabled={!complete || busy || verified}
        >
          {verified ? "Verified" : busy ? "Verifying…" : "Verify"}
        </Button>
      </div>
    </div>
  );
}

function StepPassword({
  password,
  setPassword,
  confirm,
  setConfirm,
  busy,
  onBack,
  onContinue,
}: {
  password: string;
  setPassword: (v: string) => void;
  confirm: string;
  setConfirm: (v: string) => void;
  busy: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const strength = useMemo(() => scorePassword(password), [password]);
  const match = password.length > 0 && password === confirm;
  const valid = strength.score >= 2 && match;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onContinue();
      }}
    >
      <Input
        type="password"
        label="Create password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock />}
        autoComplete="new-password"
      />

      {password ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < strength.score
                    ? strength.score === 1
                      ? "bg-red-400"
                      : strength.score === 2
                      ? "bg-amber-400"
                      : strength.score === 3
                      ? "bg-lime-400"
                      : "bg-green-400"
                    : "bg-white/[0.08]"
                )}
              />
            ))}
          </div>
          <span className="text-[11px] text-white/50">{strength.label}</span>
        </div>
      ) : null}

      <Input
        type="password"
        label="Confirm password"
        placeholder="Re-enter password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        leftIcon={<Lock />}
        autoComplete="new-password"
      />
      {confirm && !match ? (
        <span className="text-[11px] text-red-300">Passwords don&apos;t match.</span>
      ) : null}

      <div className="flex items-center gap-2 mt-1">
        <Button variant="secondary" size="lg" onClick={onBack} type="button" leftIcon={<ArrowLeft />}>
          Back
        </Button>
        <Button size="lg" className="flex-1" disabled={!valid || busy}>
          {busy ? "Saving…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}

function StepIdentity({
  busy,
  onSubmit,
  onBack,
}: {
  busy: boolean;
  onSubmit: (idDoc: File | null, selfie: File | null) => void;
  onBack: () => void;
}) {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center text-center gap-3">
        <span className="inline-flex items-center justify-center size-12 rounded-full bg-gradient-brand-soft border border-white/10">
          <IdCard className="size-5 text-white" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">Verify your identity</h2>
          <p className="text-sm text-white/55 mt-1">
            Optional. This helps us keep FanzyX safe and unlocks payouts faster. You can complete
            this anytime from your dashboard.
          </p>
        </div>
      </div>

      <UploadTile
        title="Government ID"
        subtitle="Passport, driver's license, or national ID"
        file={idFile}
        onFile={setIdFile}
        icon={<Upload className="size-4" />}
      />
      <UploadTile
        title="Selfie"
        subtitle="A clear photo of your face for verification"
        file={selfieFile}
        onFile={setSelfieFile}
        icon={<Camera className="size-4" />}
      />

      <div className="flex flex-col gap-2 mt-1">
        <Button
          size="lg"
          className="w-full"
          onClick={() => onSubmit(idFile, selfieFile)}
          disabled={busy}
        >
          {busy ? "Uploading…" : idFile || selfieFile ? "Submit for review" : "Continue"}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" onClick={onBack} type="button" leftIcon={<ArrowLeft />}>
            Back
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="flex-1"
            onClick={() => onSubmit(null, null)}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}

function UploadTile({
  title,
  subtitle,
  file,
  onFile,
  icon,
}: {
  title: string;
  subtitle: string;
  file: File | null;
  onFile: (f: File | null) => void;
  icon: React.ReactNode;
}) {
  const id = `upload-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-center gap-3 rounded-[14px] hairline p-3 cursor-pointer transition-colors",
        file ? "bg-gradient-brand-soft" : "bg-white/[0.03] hover:bg-white/[0.05]"
      )}
    >
      <span className="inline-flex items-center justify-center size-10 rounded-[10px] bg-white/[0.06] hairline text-white/80 shrink-0">
        {file ? <Check className="size-4 text-green-300" /> : icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{title}</div>
        <div className="text-[11px] text-white/55 truncate">
          {file ? file.name : subtitle}
        </div>
      </div>
      <span className="text-xs text-white/70 shrink-0">{file ? "Change" : "Upload"}</span>
      <input
        id={id}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const s = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const label =
    s === 4 ? "Strong password" : s === 3 ? "Good password" : s === 2 ? "Fair — add a number or symbol" : "Weak — use 8+ chars, mix cases";
  return { score: s, label };
}
