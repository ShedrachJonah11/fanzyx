"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import {
  GOOGLE_INTENT_KEY,
  GOOGLE_REDIRECT_PATH,
  GOOGLE_STATE_KEY,
  type GoogleOauthIntent,
} from "@/components/auth/GoogleSignInButton";
import { useAuth } from "@/services/context";
import { ApiError } from "@/services/apiClient";
import { postAuthRoute } from "@/services/postAuthRoute";

function GoogleCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithGoogleCallback } = useAuth();
  const [status, setStatus] = useState<"working" | "failed">("working");
  const [detail, setDetail] = useState<string>("Finishing sign-in with Google…");
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");

    const clearIntent = () => {
      sessionStorage.removeItem(GOOGLE_STATE_KEY);
      sessionStorage.removeItem(GOOGLE_INTENT_KEY);
    };

    const failWith = (msg: string, nextPath: string = "/login") => {
      clearIntent();
      setStatus("failed");
      setDetail(msg);
      toast.error(msg);
      setTimeout(() => router.replace(nextPath), 1500);
    };

    if (oauthError) {
      failWith(
        oauthError === "access_denied"
          ? "You cancelled Google sign-in."
          : `Google returned an error: ${oauthError}`
      );
      return;
    }

    if (!code || !state) {
      failWith("Missing authorization code from Google.");
      return;
    }

    const savedState = sessionStorage.getItem(GOOGLE_STATE_KEY);
    if (!savedState || savedState !== state) {
      failWith("Sign-in link is invalid or expired. Try again.");
      return;
    }

    let intent: GoogleOauthIntent = {};
    try {
      const raw = sessionStorage.getItem(GOOGLE_INTENT_KEY);
      if (raw) intent = JSON.parse(raw) as GoogleOauthIntent;
    } catch {
      intent = {};
    }

    const redirectUri = `${window.location.origin}${GOOGLE_REDIRECT_PATH}`;

    (async () => {
      try {
        const user = await loginWithGoogleCallback({
          code,
          redirectUri,
          state,
          role: intent.role,
        });
        clearIntent();
        toast.success("Signed in with Google");
        router.replace(postAuthRoute(user, intent.next));
      } catch (e) {
        clearIntent();
        if (e instanceof ApiError) {
          if (e.code === "no_account" || e.code === "user_not_found") {
            const email =
              e.data && typeof e.data === "object" && "email" in e.data
                ? String((e.data as { email?: unknown }).email ?? "")
                : "";
            setStatus("failed");
            setDetail("No FanzyX account yet — sending you to sign up.");
            toast.info(
              email
                ? `No FanzyX account for ${email}. Let's create one.`
                : "No FanzyX account yet. Let's create one."
            );
            const q = email ? `?email=${encodeURIComponent(email)}` : "";
            setTimeout(() => router.replace(`/signup${q}`), 1200);
            return;
          }
          if (e.code === "account_disabled") {
            failWith("This account has been disabled.");
            return;
          }
        }
        failWith(
          e instanceof Error ? e.message : "Couldn't finish Google sign-in."
        );
      }
    })();
  }, [params, router, loginWithGoogleCallback]);

  return (
    <div className="min-h-screen bg-app flex flex-col">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center">
          <Logo size="md" />
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        {status === "working" ? (
          <span
            aria-hidden
            className="size-10 rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
          />
        ) : (
          <span
            aria-hidden
            className="size-10 rounded-full border-2 border-red-400/40 border-t-red-400 animate-spin"
          />
        )}
        <p className="text-sm text-white/70 max-w-xs text-center">{detail}</p>
      </main>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-app flex items-center justify-center">
          <span className="size-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
        </div>
      }
    >
      <GoogleCallbackInner />
    </Suspense>
  );
}
