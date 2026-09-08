"use client";

import { useState } from "react";
import { toast } from "sonner";

export const GOOGLE_STATE_KEY = "fanzyx.google_oauth_state";
export const GOOGLE_INTENT_KEY = "fanzyx.google_oauth_intent";
export const GOOGLE_REDIRECT_PATH = "/auth/google/callback";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export type GoogleRole = "fan" | "creator";

export interface GoogleOauthIntent {
  role?: GoogleRole;
  next?: string;
}

export interface GoogleSignInButtonProps {
  label?: string;
  role?: GoogleRole;
  next?: string;
  className?: string;
  disabled?: boolean;
  disabledReason?: string;
}

function randomState(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function buildGoogleAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function GoogleSignInButton({
  label = "Continue with Google",
  role,
  next,
  className,
  disabled = false,
  disabledReason,
}: GoogleSignInButtonProps) {
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    if (disabled) {
      if (disabledReason) toast.error(disabledReason);
      return;
    }
    if (!CLIENT_ID) {
      toast.error("Google Sign-In isn't configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
      return;
    }
    if (busy) return;

    setBusy(true);
    try {
      const state = randomState();
      const intent: GoogleOauthIntent = { role, next };
      sessionStorage.setItem(GOOGLE_STATE_KEY, state);
      sessionStorage.setItem(GOOGLE_INTENT_KEY, JSON.stringify(intent));
      const redirectUri = `${window.location.origin}${GOOGLE_REDIRECT_PATH}`;
      window.location.href = buildGoogleAuthUrl(state, redirectUri);
    } catch (e) {
      setBusy(false);
      toast.error("Couldn't start Google sign-in.");
      console.error(e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || disabled || !CLIENT_ID}
      aria-busy={busy}
      aria-disabled={disabled}
      title={disabled ? disabledReason : undefined}
      className={
        className ??
        "btn-google h-11 rounded-[12px] text-sm font-medium transition-colors flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
      }
    >
      {busy ? <Spinner /> : <><GoogleG /> {label}</>}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-4 rounded-full border-2 border-black/20 border-t-black/70 animate-spin"
    />
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.2l7.9 6.1C12.5 13 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.1-.5-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z" />
      <path fill="#FBBC05" d="M10.6 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.6 2.4 10.8l8.2-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.5-3.5-13.4-8.4l-8.2 6.1C6.7 42.6 14.7 48 24 48z" />
    </svg>
  );
}
