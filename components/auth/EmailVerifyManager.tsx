"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Mail, MailCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { emailVerify } from "@/services/modules/auth";
import { useAuth } from "@/services/context";
import { ApiError } from "@/services/apiClient";

const SESSION_DISMISSED_KEY = "fanzyx.emailVerify.dismissed";
const SESSION_AUTOFIRED_KEY = "fanzyx.emailVerify.autoFired";
const RESEND_COOLDOWN_MS = 60_000;

type EmailVerifyContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const EmailVerifyContext = createContext<EmailVerifyContextValue | null>(null);

export function useEmailVerify(): EmailVerifyContextValue {
  const ctx = useContext(EmailVerifyContext);
  if (!ctx) return { open: () => {}, close: () => {}, isOpen: false };
  return ctx;
}

export function EmailVerifyManager({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [isOpen, setOpen] = useState(false);

  const unverified = !!user && user.emailVerifiedAt === null;
  const hasEmail = !!user?.email;

  // Auto-fire once per session for unverified users
  useEffect(() => {
    if (loading || !unverified || !hasEmail) return;
    if (typeof window === "undefined") return;
    const fired = sessionStorage.getItem(SESSION_AUTOFIRED_KEY);
    const dismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY);
    if (fired || dismissed) return;
    sessionStorage.setItem(SESSION_AUTOFIRED_KEY, "1");
    setOpen(true);
  }, [loading, unverified, hasEmail]);

  const open = useCallback(() => {
    if (!unverified) return;
    setOpen(true);
  }, [unverified]);

  const close = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSkip = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
    }
    setOpen(false);
  }, []);

  const value = useMemo<EmailVerifyContextValue>(
    () => ({ open, close, isOpen }),
    [open, close, isOpen]
  );

  return (
    <EmailVerifyContext.Provider value={value}>
      {children}
      {isOpen && user && user.email ? (
        <EmailVerifyModal email={user.email} onClose={handleSkip} />
      ) : null}
    </EmailVerifyContext.Provider>
  );
}

/* ── Modal ────────────────────────────────────────────── */

type Stage = "idle" | "sent";

function EmailVerifyModal({
  email,
  onClose,
}: {
  email: string;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<Stage>("idle");
  const [sending, setSending] = useState(false);
  const [cooldownEnds, setCooldownEnds] = useState<number>(0);
  const [now, setNow] = useState<number>(() => Date.now());

  const masked = maskEmail(email);
  const remaining = Math.max(0, Math.ceil((cooldownEnds - now) / 1000));
  const canResend = !sending && remaining <= 0;

  useEffect(() => {
    if (cooldownEnds <= now) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [cooldownEnds, now]);

  const sendLink = useCallback(async () => {
    if (sending) return;
    setSending(true);
    try {
      const res = await emailVerify.request();
      if (res.alreadyVerified) {
        toast.success("You're already verified.");
        onClose();
        return;
      }
      if (res.sent) {
        toast.success("Link sent — check your inbox.");
        setStage("sent");
        setCooldownEnds(Date.now() + RESEND_COOLDOWN_MS);
      }
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "rate_limited") {
          toast.error("Please wait a moment before requesting another link.");
          setCooldownEnds(Date.now() + RESEND_COOLDOWN_MS);
        } else if (e.code === "no_email") {
          toast.error("No email on file for this account.");
        } else {
          toast.error(e.detail ?? e.message);
        }
      }
    } finally {
      setSending(false);
    }
  }, [sending, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={sending ? undefined : onClose}
      />
      <div className="relative w-full max-w-md surface-card p-6 flex flex-col gap-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex items-center justify-center size-8 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06]"
        >
          <X className="size-4" />
        </button>

        {stage === "idle" ? (
          <>
            <div className="flex flex-col items-center text-center gap-3">
              <span className="inline-flex items-center justify-center size-12 rounded-full bg-gradient-brand-soft border border-white/10">
                <Mail className="size-5 text-white" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Verify your email
                </h3>
                <p className="text-sm text-white/60 mt-1 max-w-sm">
                  We&apos;ll send a link to{" "}
                  <span className="text-white/85">{masked}</span> — click it and
                  you&apos;re set.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.05]">
              <Button variant="ghost" onClick={onClose} disabled={sending}>
                Skip for now
              </Button>
              <div className="flex-1" />
              <Button onClick={sendLink} disabled={sending}>
                {sending ? "Sending…" : "Send verify link"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-center gap-3">
              <span className="inline-flex items-center justify-center size-12 rounded-full bg-gradient-brand-soft border border-white/10">
                <MailCheck className="size-5 text-white" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Check your inbox
                </h3>
                <p className="text-sm text-white/60 mt-1 max-w-sm">
                  We sent a link to{" "}
                  <span className="text-white/85">{masked}</span>. Click it from
                  any device to finish.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-white/55">Didn&apos;t get it?</span>
              <button
                type="button"
                onClick={sendLink}
                disabled={!canResend}
                className="text-white/80 hover:text-white underline underline-offset-4 disabled:opacity-50 disabled:no-underline"
              >
                {sending
                  ? "Sending…"
                  : remaining > 0
                  ? `Resend in ${remaining}s`
                  : "Resend link"}
              </button>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-white/[0.05]">
              <Button onClick={onClose}>Close</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const first = local[0] ?? "";
  return `${first}***@${domain}`;
}
