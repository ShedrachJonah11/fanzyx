"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, TriangleAlert } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { emailVerify } from "@/services/modules/auth";
import { useAuth } from "@/services/context";
import { ApiError } from "@/services/apiClient";

type Status = "loading" | "success" | "invalid" | "no-token";

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, refresh } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    const token = params.get("token");
    if (!token) {
      setStatus("no-token");
      return;
    }

    (async () => {
      try {
        await emailVerify.confirmByToken(token);
        setStatus("success");
        toast.success("Email verified.");
        // If a user is signed in on this device, refresh /me so the header
        // pill disappears and any cached emailVerifiedAt updates.
        try {
          if (user) await refresh();
        } catch {
          // ignore — verification already succeeded server-side
        }
        setTimeout(() => {
          router.replace(user ? "/feed" : "/login");
        }, 1500);
      } catch (e) {
        if (e instanceof ApiError && e.code === "invalid_verify_token") {
          setStatus("invalid");
        } else {
          setStatus("invalid");
        }
      }
    })();
  }, [params, router, user, refresh]);

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center">
          <Logo size="md" />
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-md w-full px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center gap-6">
        {status === "loading" ? (
          <>
            <span
              aria-hidden
              className="size-12 rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
            />
            <p className="text-sm text-white/70">Verifying your email…</p>
          </>
        ) : null}

        {status === "success" ? (
          <>
            <div className="size-16 rounded-full bg-gradient-brand flex items-center justify-center shadow-[0_15px_50px_-10px_rgba(105,41,252,0.7)]">
              <Check className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                Email verified
              </h1>
              <p className="text-white/60 mt-2">Redirecting…</p>
            </div>
          </>
        ) : null}

        {status === "invalid" ? (
          <>
            <div className="size-16 rounded-full bg-red-500/15 border border-red-400/30 flex items-center justify-center">
              <TriangleAlert className="size-6 text-red-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                This link is invalid or expired
              </h1>
              <p className="text-white/60 mt-2">
                Sign in to send yourself a new verification link.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="lg" onClick={() => router.push("/login")}>
                Go to login
              </Button>
              <Button size="lg" variant="secondary" href="/">
                Back to home
              </Button>
            </div>
          </>
        ) : null}

        {status === "no-token" ? (
          <>
            <div className="size-16 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
              <TriangleAlert className="size-6 text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                Invalid link
              </h1>
              <p className="text-white/60 mt-2">
                Open the verification link from your email to continue.
              </p>
            </div>
            <Link
              href="/login"
              className="text-sm text-white/70 hover:text-white underline underline-offset-4"
            >
              Go to login
            </Link>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-app flex items-center justify-center">
          <span className="size-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
