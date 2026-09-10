"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, AtSign, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/services/context";
import { ApiError } from "@/services/apiClient";
import { postAuthRoute } from "@/services/postAuthRoute";

const FAN_ERROR: Record<string, string> = {
  username_taken: "That username is already taken.",
  email_taken: "An account already exists for this email.",
  weak_password: "Password is too weak. Use 8+ characters with a mix.",
  age_required: "You must confirm you are 18 or older.",
  rate_limited: "Too many attempts. Try again in a moment.",
};

export default function FanSignupPage() {
  const router = useRouter();
  const { signupFan } = useAuth();

  const initialFromUrl = () => {
    if (typeof window === "undefined") return { email: "", ref: "" };
    const params = new URLSearchParams(window.location.search);
    return {
      email: params.get("email") ?? "",
      ref: params.get("ref")?.trim() ?? "",
    };
  };
  const initial = useState(initialFromUrl)[0];

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(initial.email);
  const [password, setPassword] = useState("");
  const [age18, setAge18] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [referralCode] = useState(initial.ref);
  const [submitting, setSubmitting] = useState(false);

  const valid =
    username.trim().length >= 3 &&
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 8 &&
    age18;

  const showError = (err: unknown) => {
    const msg =
      err instanceof ApiError
        ? FAN_ERROR[err.code] ?? err.detail ?? err.message
        : "Something went wrong. Try again.";
    toast.error(msg);
  };

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!valid) return;
      setSubmitting(true);
      try {
        const user = await signupFan({
          username: username.trim(),
          email: email.trim(),
          password,
          age18: true,
          emailOptin: emailOptIn,
          referralCode: referralCode.trim() || undefined,
        });
        toast.success("Account created — welcome to FanzyX");
        router.replace(postAuthRoute(user));
      } catch (err) {
        showError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [
      valid,
      signupFan,
      username,
      email,
      password,
      emailOptIn,
      referralCode,
      router,
    ]
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/signup"
        className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white -mb-1 w-max"
      >
        <ArrowLeft className="size-3.5" /> Change signup type
      </Link>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">
          Create your fan account
        </h1>
        <p className="text-sm text-white/55">
          Join FanzyX to follow creators and access exclusive content.
        </p>
      </div>

      <GoogleSignInButton
        role="fan"
        next="/feed"
        label="Continue with Google"
      />

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/40">
        <div className="flex-1 divider" /> or <div className="flex-1 divider" />
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Input
          label="Username"
          placeholder="alexokafor"
          leftIcon={<AtSign />}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <Input
          type="email"
          label="Email"
          placeholder="you@fanzyx.app"
          leftIcon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Input
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          leftIcon={<Lock />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        {referralCode ? (
          <div className="rounded-[10px] bg-white/[0.04] hairline px-3 py-2 text-[12px] text-white/70 flex items-center gap-2">
            <span className="inline-flex items-center justify-center size-5 rounded-full bg-gradient-brand text-white on-media text-[10px] font-bold">
              ✓
            </span>
            <span>
              Referral code{" "}
              <span className="font-semibold text-white font-mono">
                {referralCode}
              </span>{" "}
              applied
            </span>
          </div>
        ) : null}

        <LegalBlock
          age18={age18}
          setAge18={setAge18}
          emailOptIn={emailOptIn}
          setEmailOptIn={setEmailOptIn}
          variant="fan"
        />

        <Button size="lg" className="w-full" disabled={!valid || submitting}>
          {submitting ? "Creating account…" : "Create fan account"}
        </Button>
      </form>

      <p className="text-sm text-white/55 text-center">
        Have an account?{" "}
        <Link href="/login" className="text-white hover:underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}

export function LegalBlock({
  age18,
  setAge18,
  emailOptIn,
  setEmailOptIn,
  variant,
}: {
  age18: boolean;
  setAge18: (v: boolean) => void;
  emailOptIn: boolean;
  setEmailOptIn: (v: boolean) => void;
  variant: "fan" | "creator";
}) {
  return (
    <div className="flex flex-col gap-3 mt-1">
      <p className="text-[11px] text-white/55 leading-relaxed">
        By signing up you agree to our{" "}
        <Link href="#" className="text-white/85 hover:text-white underline underline-offset-2">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="text-white/85 hover:text-white underline underline-offset-2">
          Privacy Policy
        </Link>
        , and confirm that you are at least 18 years old.
      </p>

      <div className="rounded-[12px] hairline bg-white/[0.02] p-3">
        <Checkbox
          checked={age18}
          onChange={setAge18}
          label={
            <>
              I confirm that I am at least 18 years old and legally permitted to{" "}
              {variant === "creator" ? "access and upload content" : "access content"} on
              FanzyX. I acknowledge that I have read, understood, and agree to abide by all
              platform rules, community guidelines, and content policies. I understand that
              failure to follow these rules may result in account suspension or termination.
            </>
          }
        />
      </div>

      <Checkbox
        checked={emailOptIn}
        onChange={setEmailOptIn}
        label={
          <>Subscribe to our emails for news, offers, and inspiration—delivered directly to you.</>
        }
      />
    </div>
  );
}
