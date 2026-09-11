"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/services/context";
import { ApiError } from "@/services/apiClient";
import { adminAuth } from "@/services/modules/admin";

/**
 * Admin login page — same auth endpoints as the public login, but branded
 * for the admin console and gates on role after success. Rendered at
 * admin.localhost/login (rewritten by middleware to /admin/login).
 *
 * useSearchParams() must sit inside a Suspense boundary so the shell can
 * render statically while the params resolve on the client.
 */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <AdminLoginInner />
    </Suspense>
  );
}

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") || "/";
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      try {
        const res = await adminAuth.login({
          email: email.trim(),
          password,
        });
        if (res.user.role !== "admin" && res.user.role !== "moderator") {
          toast.error("This account doesn't have admin access.");
          setSubmitting(false);
          return;
        }
        // Hydrate the AuthProvider so the layout gate + sidebar pick up
        // the fresh user without a full reload.
        await refresh?.();
        router.replace(next);
      } catch (err) {
        // 401 → generic "invalid credentials" (never leak which field was wrong).
        const isAuth401 = err instanceof ApiError && err.status === 401;
        toast.error(
          isAuth401
            ? "Invalid credentials"
            : err instanceof ApiError
            ? err.detail ?? err.message
            : "Sign-in failed. Try again."
        );
        setSubmitting(false);
      }
    },
    [submitting, email, password, refresh, router, next]
  );

  return (
    <LoginShell>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <Input
          type="email"
          label="Email"
          placeholder="you@fanzyx.app"
          leftIcon={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          leftIcon={<Lock />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Button size="lg" className="w-full mt-2" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </LoginShell>
  );
}

function LoginShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#07070A] text-white p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center justify-center size-12 rounded-full bg-gradient-brand text-white on-media shadow-[0_10px_40px_-12px_rgba(253,35,167,0.6)]">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h1 className="text-[22px] font-bold text-white">Admin console</h1>
            <p className="text-sm text-white/55 mt-1">
              Staff sign-in only.
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
