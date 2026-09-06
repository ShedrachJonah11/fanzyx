"use client";

import { Check, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { VerifiedBadge } from "@/components/ui/Badge";
import type { Creator } from "@/lib/mock-data";
import { formatNaira } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  creator: Creator;
};

const benefits = [
  "Exclusive posts",
  "Subscriber-only media",
  "Direct messages",
  "Early access",
];

export function SubscriptionModal({ open, onClose, creator }: Props) {
  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative">
          <Avatar name={creator.name} gradient={creator.avatarGradient} size={72} />
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center size-6 rounded-full bg-gradient-brand shadow-[0_6px_20px_-4px_rgba(105,41,252,0.6)]">
            <Sparkles className="size-3 text-white" />
          </span>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <div className="inline-flex items-center gap-1.5">
            <h2 className="text-xl font-semibold text-white">Subscribe to {creator.name}</h2>
            {creator.verified ? <VerifiedBadge /> : null}
          </div>
          <span className="text-sm text-white/50">@{creator.username}</span>
        </div>

        <div className="w-full mt-2 surface-elev rounded-[14px] p-5 flex flex-col items-center gap-1">
          <span className="text-xs uppercase text-white/50 tracking-wider">Monthly plan</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold text-white">
              {formatNaira(creator.monthlyPrice)}
            </span>
            <span className="text-sm text-white/50">/ month</span>
          </div>
          <span className="text-[11px] text-white/40 mt-1">Cancel anytime</span>
        </div>

        <ul className="w-full mt-2 flex flex-col gap-2">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm text-white/80">
              <span className="inline-flex items-center justify-center size-5 rounded-full bg-gradient-brand-soft border border-white/10">
                <Check className="size-3 text-white" />
              </span>
              {b}
            </li>
          ))}
        </ul>

        <Button size="lg" className="w-full mt-3">
          Continue to payment
        </Button>
        <button
          onClick={onClose}
          className="text-xs text-white/50 hover:text-white/80 mt-1"
        >
          Not now
        </button>
      </div>
    </Modal>
  );
}
