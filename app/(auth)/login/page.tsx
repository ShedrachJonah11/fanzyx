"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { toast } from "sonner";
import { AtSign, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/services/context";
import { ApiError } from "@/services/apiClient";
import { postAuthRoute } from "@/services/postAuthRoute";

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "Wrong email/username or password.",
  account_disabled: "This account has been disabled. Contact support.",
  rate_limited: "Too many attempts. Try again in a moment.",
};

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { login } = useAuth();
  const nextPath = search.get("next");

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const showError = (err: unknown) => {
    const msg =
      err instanceof ApiError
        ? AUTH_MESSAGES[err.code] ?? err.detail ?? err.message
        : "Something went wrong. Try again.";
    toast.error(msg);
  };

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!emailOrUsername || !password) return;
      setSubmitting(true);
      try {
        const user = await login({ emailOrUsername, password });
        toast.success("Welcome back");
        router.replace(postAuthRoute(user, nextPath));
      } catch (err) {
        showError(err);
      } finally {
        setSubmitting(false);
      }
    },
    [emailOrUsername, password, login, router, nextPath]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">Welcome back</h1>
        <p className="text-sm text-white/55">Log in to continue to FanzyX.</p>
      </div>

      <GoogleSignInButton next={nextPath ?? undefined} label="Continue with Google" />

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/40">
        <div className="flex-1 divider" /> or <div className="flex-1 divider" />
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Input
          label="Email or username"
          placeholder="you@fanzyx.app"
          leftIcon={<AtSign />}
          autoComplete="username"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          leftIcon={<Lock />}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-2 text-white/60">
            <input
              type="checkbox"
              className="accent-[#6929FC]"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />{" "}
            Remember me
          </label>
          <Link href="/forgot-password" className="text-white/70 hover:text-white">
            Forgot password?
          </Link>
        </div>
        <Button size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="text-sm text-white/55 text-center">
        New here?{" "}
        <Link href="/signup" className="text-white hover:underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
