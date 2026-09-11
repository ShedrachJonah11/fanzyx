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
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/services/context";

const SESSION_DISMISSED_KEY = "fanzyx.identityVerify.dismissed";
const SESSION_AUTOFIRED_KEY = "fanzyx.identityVerify.autoFired";

type IdentityVerifyContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const IdentityVerifyContext =
  createContext<IdentityVerifyContextValue | null>(null);

export function useIdentityVerify(): IdentityVerifyContextValue {
  const ctx = useContext(IdentityVerifyContext);
  if (!ctx) return { open: () => {}, close: () => {}, isOpen: false };
  return ctx;
}

/**
 * Fires the "become a verified creator" modal once per browser session for
 * creators whose identity is still `none` or `rejected`. Skipped for
 * `pending` (already submitted, waiting on review) and `verified`.
 */
export function IdentityVerifyManager({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [isOpen, setOpen] = useState(false);

  const isCreator = user?.role === "creator";
  const needsPrompt =
    !!user &&
    isCreator &&
    (user.identityStatus === "none" || user.identityStatus === "rejected");

  useEffect(() => {
    if (loading || !needsPrompt) return;
    if (typeof window === "undefined") return;
    const fired = sessionStorage.getItem(SESSION_AUTOFIRED_KEY);
    const dismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY);
    if (fired || dismissed) return;
    sessionStorage.setItem(SESSION_AUTOFIRED_KEY, "1");
    // Auto-fire once per session after auth resolves — an intentional
    // side effect, not a derived value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
  }, [loading, needsPrompt]);

  const open = useCallback(() => {
    if (!needsPrompt) return;
    setOpen(true);
  }, [needsPrompt]);

  const close = useCallback(() => setOpen(false), []);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, "1");
    }
    setOpen(false);
  }, []);

  const value = useMemo<IdentityVerifyContextValue>(
    () => ({ open, close, isOpen }),
    [open, close, isOpen]
  );

  return (
    <IdentityVerifyContext.Provider value={value}>
      {children}
      {isOpen && user ? (
        <IdentityVerifyModal
          rejected={user.identityStatus === "rejected"}
          onDismiss={dismiss}
        />
      ) : null}
    </IdentityVerifyContext.Provider>
  );
}

function IdentityVerifyModal({
  rejected,
  onDismiss,
}: {
  rejected: boolean;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const start = () => {
    onDismiss();
    router.push("/dashboard/settings/identity");
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onDismiss}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="identity-verify-title"
        className="relative w-full max-w-md surface-elev rounded-[20px] p-8 flex flex-col items-center text-center gap-5"
      >
        <span className="inline-flex items-center justify-center size-14 rounded-full bg-gradient-brand text-white on-media shadow-[0_10px_40px_-12px_rgba(253,35,167,0.6)]">
          <ShieldCheck className="size-6" />
        </span>

        <div className="flex flex-col gap-2">
          <h2
            id="identity-verify-title"
            className="text-[20px] leading-tight font-bold bg-clip-text text-transparent bg-gradient-brand"
          >
            {rejected
              ? "Resubmit and become a Verified Creator"
              : "Apply and become a Verified Creator within a Couple Hours!"}
          </h2>
          <p className="text-sm text-white/65 max-w-sm mx-auto leading-relaxed">
            {rejected
              ? "Your last submission needs another look. Update your details and re-apply to unlock the full FanzyX creator toolkit."
              : "Once you have successfully completed the identity verification process, you will gain access to the full FanzyX creator toolkit."}
          </p>
        </div>

        <div className="w-full flex items-center justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onDismiss}
            className="flex-1 sm:flex-initial"
          >
            Remind me later
          </Button>
          <Button onClick={start} className="flex-1 sm:flex-initial">
            {rejected ? "Resubmit" : "Start Verification"}
          </Button>
        </div>
      </div>
    </div>
  );
}
