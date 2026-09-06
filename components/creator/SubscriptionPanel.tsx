"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Creator } from "@/lib/mock-data";
import { cn, formatNaira } from "@/lib/utils";

type Props = {
  creator: Creator;
  onSubscribe: () => void;
};

export function SubscriptionPanel({ creator, onSubscribe }: Props) {
  const [bundlesOpen, setBundlesOpen] = useState(true);

  const bundles = [
    { label: "1-Month subscription plan", price: creator.monthlyPrice },
    { label: "2-Months", price: Math.round(creator.monthlyPrice * 1.8) },
    { label: "3-Months", price: Math.round(creator.monthlyPrice * 2.7) },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* SUBSCRIBE NOW */}
      <div>
        <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-white/60 mb-3">
          Subscribe now
        </h3>
        <button
          onClick={onSubscribe}
          className="on-media w-full h-12 rounded-full bg-[#FD23A7] hover:bg-[#E31E97] text-white font-bold uppercase text-[13px] tracking-[0.08em] flex items-center justify-between px-6 transition-colors shadow-[0_8px_24px_-8px_rgba(253,35,167,0.55)]"
        >
          <span>Subscribe</span>
          <span>Now</span>
        </button>
      </div>

      {/* SUBSCRIPTION IN BUNDLES */}
      <div>
        <button
          type="button"
          onClick={() => setBundlesOpen((v) => !v)}
          aria-expanded={bundlesOpen}
          className="w-full flex items-center justify-between mb-3 group"
        >
          <h3 className="text-[12px] uppercase tracking-[0.14em] font-bold text-white/60 group-hover:text-white/80 transition-colors">
            Subscription in bundles
          </h3>
          <ChevronDown
            className={cn(
              "size-4 text-white/50 group-hover:text-white/80 transition-transform",
              bundlesOpen && "rotate-180"
            )}
          />
        </button>
        {bundlesOpen ? (
          <ul className="flex flex-col gap-2.5">
            {bundles.map((b, i) => (
              <li key={i}>
                <button
                  onClick={onSubscribe}
                  className="w-full h-11 rounded-full border border-[#FD23A7]/45 bg-[#FD23A7]/[0.08] hover:bg-[#FD23A7]/[0.16] hover:border-[#FD23A7]/70 text-[#FD23A7] font-bold uppercase text-[11px] tracking-[0.10em] flex items-center justify-between px-5 transition-colors"
                >
                  <span>{b.label}</span>
                  <span>{formatNaira(b.price)}.00</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
