"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { auth as authApi } from "@/services/modules";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!/\S+@\S+\.\S+/.test(email) || submitting) return;
      setSubmitting(true);
      try {
        // Backend returns 202 unconditionally — either way we show the same view.
        await authApi.forgotPassword({ email: email.trim() });
      } catch {
        // Ignore — same UX regardless of outcome.
      } finally {
        setSubmitting(false);
        setSent(true);
      }
    },
    [email, submitting]
  );

  if (sent) {
    return (
      <div className="flex flex-col gap-6 items-center text-center">
        <div className="size-14 rounded-full bg-gradient-brand flex items-center justify-center shadow-[0_15px_50px_-10px_rgba(105,41,252,0.7)]">
          <Check className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-sm">
            If an account exists for <span className="text-white/85">{email}</span>, we&apos;ve
            sent a link to reset your password.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm text-white/70 hover:text-white underline underline-offset-4"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-white/55">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Input
          type="email"
          label="Email"
          placeholder="you@fanzyx.app"
          leftIcon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <Button size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-sm text-white/55 text-center">
        Remember your password?{" "}
        <Link href="/login" className="text-white hover:underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}
