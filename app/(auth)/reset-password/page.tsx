"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Lock, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { auth as authApi } from "@/services/modules";
import { ApiError } from "@/services/apiClient";
import { cn } from "@/lib/utils";

const RESET_ERROR: Record<string, string> = {
  invalid_token: "This reset link is invalid or has been used.",
  token_expired: "This reset link has expired. Request a new one.",
  weak_password: "Password is too weak. Use 8+ characters with a mix.",
  rate_limited: "Too many attempts. Try again in a moment.",
};

function ResetPasswordForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const strength = useMemo(() => scorePassword(password), [password]);
  const match = password.length > 0 && password === confirm;
  const valid = strength.score >= 2 && match && !!token;

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!valid || !token) return;
      setSubmitting(true);
      try {
        await authApi.resetPassword({ token, newPassword: password });
        toast.success("Password updated");
        setDone(true);
        setTimeout(() => router.replace("/login"), 1500);
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? RESET_ERROR[err.code] ?? err.detail ?? err.message
            : "Something went wrong. Try again.";
        toast.error(msg);
      } finally {
        setSubmitting(false);
      }
    },
    [valid, token, password, router]
  );

  if (!token) {
    return (
      <div className="flex flex-col gap-6 items-center text-center">
        <div className="size-14 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
          <TriangleAlert className="size-6 text-amber-300" />
        </div>
        <div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">
            Missing reset token
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-sm">
            Open the reset link from your email to continue.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="text-sm text-white/70 hover:text-white underline underline-offset-4"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6 items-center text-center">
        <div className="size-14 rounded-full bg-gradient-brand flex items-center justify-center shadow-[0_15px_50px_-10px_rgba(105,41,252,0.7)]">
          <Check className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-[22px] font-semibold text-white tracking-tight">Password updated</h1>
          <p className="text-sm text-white/60 mt-1">Redirecting you to log in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-white/55">Enter a new password for your account.</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Input
          type="password"
          label="New password"
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

        <Button size="lg" className="w-full" disabled={!valid || submitting}>
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
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
