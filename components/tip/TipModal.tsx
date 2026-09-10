"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/services/context";
import { toast } from "sonner";
import { DollarSign, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { wallet } from "@/services/modules/wallet";
import { ApiError } from "@/services/apiClient";
import type { WalletOut } from "@/services/dtos";
import { cn } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

const NGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const MIN_TIP_KOBO = 10_000; // ₦100
const MAX_TIP_KOBO = 100_000_000; // ₦1,000,000
const MAX_MESSAGE = 500;

const TIP_PRESETS_KOBO = [
  500_000, // ₦5,000
  700_000, // ₦7,000
  1_000_000, // ₦10,000
  1_500_000, // ₦15,000
  2_000_000, // ₦20,000
  5_000_000, // ₦50,000
  10_000_000, // ₦100,000
  20_000_000, // ₦200,000
  50_000_000, // ₦500,000
  100_000_000, // ₦1,000,000
];

export interface TipTarget {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  postId?: string;
}

export function TipModal({
  target,
  onClose,
  onSent,
}: {
  target: TipTarget;
  onClose: () => void;
  onSent?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [balance, setBalance] = useState<WalletOut | null>(null);
  const [amountKobo, setAmountKobo] = useState<number | null>(null);
  const [customOn, setCustomOn] = useState(false);
  const [customNaira, setCustomNaira] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      try {
        const w = await wallet.get();
        if (!cancelled) setBalance(w);
      } catch {
        // Balance unavailable — the user just sees "—" and we still let
        // them try; server enforces the cap.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pickPreset = (kobo: number) => {
    setAmountKobo(kobo);
    setCustomOn(false);
    setCustomNaira("");
  };

  const openCustom = () => {
    setCustomOn(true);
    setAmountKobo(null);
    setCustomNaira("");
  };

  // Resolve the amount to send: custom input overrides preset when active.
  const effectiveAmountKobo = customOn
    ? (() => {
        const n = Number(customNaira);
        if (!Number.isFinite(n) || n <= 0) return null;
        return Math.round(n * 100);
      })()
    : amountKobo;

  const overBalance =
    effectiveAmountKobo !== null &&
    balance !== null &&
    effectiveAmountKobo > balance.balanceKobo;

  const withinRange =
    effectiveAmountKobo !== null &&
    effectiveAmountKobo >= MIN_TIP_KOBO &&
    effectiveAmountKobo <= MAX_TIP_KOBO;

  const canSend = withinRange && !overBalance && !sending;

  const topUp = () => {
    onClose();
    router.push(user?.role === "creator" ? "/dashboard/earnings" : "/wallet");
  };

  const send = async () => {
    if (!withinRange || sending) return;
    if (overBalance) {
      topUp();
      return;
    }
    setSending(true);
    try {
      await wallet.tip({
        creatorUsername: target.username,
        amountKobo: effectiveAmountKobo!,
        postId: target.postId,
        message: message.trim() || undefined,
      });
      const naira = Math.round(effectiveAmountKobo! / 100);
      toast.success(
        `Nice — you tipped ${target.displayName || target.username} ${NGN.format(naira)}.`
      );
      onSent?.();
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        const map: Record<string, string> = {
          creator_not_found: "Creator not found.",
          insufficient_funds: "Not enough in your wallet. Top up to continue.",
          self_tip: "You can't tip yourself.",
          validation_error: `Amount must be between ${NGN.format(100)} and ${NGN.format(1_000_000)}.`,
          rate_limited: "Slow down a sec — try again in a moment.",
        };
        toast.error(map[e.code] ?? e.detail ?? e.message);
      } else {
        toast.error("Couldn't send tip.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={sending ? undefined : onClose}
      />
      <div className="relative w-full max-w-md surface-card p-6 flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Send a Tip</h3>
            <p className="text-sm text-white/55 mt-0.5">
              Show some love — 100% instant.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            aria-label="Close"
            className="inline-flex items-center justify-center size-8 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06] disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-3">
          <Avatar
            name={target.displayName || target.username}
            image={target.avatarUrl ?? undefined}
            gradient={BRAND_GRADIENT}
            size={44}
          />
          <div className="flex flex-col min-w-0">
            <span className="text-white font-medium truncate">
              {target.displayName || target.username}
            </span>
            <span className="text-xs text-white/55 truncate">
              @{target.username}
            </span>
          </div>
        </div>

        {/* Preset amounts */}
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-white/45">
            Choose an amount
          </span>
          <div className="grid grid-cols-3 gap-2">
            {TIP_PRESETS_KOBO.map((kobo) => {
              const active = !customOn && amountKobo === kobo;
              return (
                <button
                  key={kobo}
                  type="button"
                  onClick={() => pickPreset(kobo)}
                  className={cn(
                    "h-10 rounded-[12px] text-[13px] font-semibold transition-colors",
                    active
                      ? "bg-gradient-brand text-white on-media"
                      : "bg-white/[0.04] hairline text-white/85 hover:bg-white/[0.08]"
                  )}
                >
                  {formatCompactNgn(kobo)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={openCustom}
              className={cn(
                "h-10 rounded-[12px] text-[13px] font-semibold transition-colors",
                customOn
                  ? "bg-gradient-brand text-white on-media"
                  : "bg-white/[0.04] hairline text-white/85 hover:bg-white/[0.08]"
              )}
            >
              Custom
            </button>
          </div>
        </div>

        {customOn ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/70">
              Custom amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/55">
                ₦
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={100}
                max={1_000_000}
                step={100}
                autoFocus
                value={customNaira}
                onChange={(e) => setCustomNaira(e.target.value)}
                placeholder="0"
                className={cn(
                  "w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white pl-8 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06]",
                  effectiveAmountKobo !== null && !withinRange &&
                    "border-red-400/40"
                )}
              />
            </div>
            <span className="text-[11px] text-white/45">
              {NGN.format(100)} – {NGN.format(1_000_000)}
            </span>
          </div>
        ) : null}

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <Textarea
            label={`Message (${message.length}/${MAX_MESSAGE})`}
            placeholder="Say something nice…"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
            className="!min-h-[80px] !resize-none"
          />
        </div>

        {/* Balance + insufficient hint */}
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-white/55">
            Wallet balance:{" "}
            <span className="text-white/85 font-medium">
              {balance ? NGN.format(balance.balanceKobo / 100) : "—"}
            </span>
          </span>
          {overBalance ? (
            <button
              type="button"
              onClick={topUp}
              className="text-[#FD5CC9] font-semibold hover:underline underline-offset-4"
            >
              Top up first
            </button>
          ) : null}
        </div>

        {/* Send */}
        <Button
          size="lg"
          onClick={send}
          disabled={!canSend && !overBalance}
          className="w-full"
          leftIcon={<DollarSign />}
        >
          {sending
            ? "Sending…"
            : overBalance
            ? "Top up wallet"
            : effectiveAmountKobo
            ? `Send ${NGN.format(effectiveAmountKobo / 100)}`
            : "Send tip"}
        </Button>
      </div>
    </div>
  );
}

/** ₦5,000 → "₦5,000"; ₦100,000 → "₦100K"; ₦1,000,000 → "₦1M" */
function formatCompactNgn(kobo: number): string {
  const naira = kobo / 100;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(0)}M`;
  if (naira >= 100_000) return `₦${(naira / 1_000).toFixed(0)}K`;
  return NGN.format(naira);
}
