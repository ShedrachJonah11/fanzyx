import { ChevronRight, Lock, Users } from "lucide-react";
import type { Subscriber } from "@/lib/mock-data";
import { cn, formatNaira, initials } from "@/lib/utils";

type Props = {
  subscriber: Subscriber;
  variant?: "hero" | "grid";
  rank?: number;
};

/* A palette of rich, layered gradients so the grid feels varied. */
const GRADIENTS = [
  {
    bg: "linear-gradient(135deg, #FD23A7 0%, #FF6BC0 50%, #FD5CC9 100%)",
    glow: "radial-gradient(70% 90% at 25% 15%, rgba(255,255,255,0.35), transparent 60%)",
  },
  {
    bg: "linear-gradient(135deg, #6929FC 0%, #8B4DFF 55%, #FD23A7 100%)",
    glow: "radial-gradient(70% 90% at 25% 15%, rgba(255,255,255,0.28), transparent 60%)",
  },
  {
    bg: "linear-gradient(135deg, #4340FA 0%, #6929FC 60%, #A05FF5 100%)",
    glow: "radial-gradient(70% 90% at 25% 15%, rgba(255,255,255,0.28), transparent 60%)",
  },
  {
    bg: "linear-gradient(135deg, #FD5CC9 0%, #FD23A7 55%, #B71787 100%)",
    glow: "radial-gradient(70% 90% at 25% 15%, rgba(255,255,255,0.30), transparent 60%)",
  },
];

const HERO_GRADIENT = {
  bg: "linear-gradient(135deg, #FF3A9E 0%, #FD23A7 45%, #FD5CC9 100%)",
  glow:
    "radial-gradient(80% 90% at 20% 10%, rgba(255,255,255,0.4), transparent 65%), radial-gradient(50% 70% at 90% 100%, rgba(255,255,255,0.18), transparent 60%)",
};

export function SubscriberCard({ subscriber, variant = "grid", rank }: Props) {
  const isHero = variant === "hero";
  const subsCount = Math.max(
    1,
    Math.round(subscriber.totalSpent / Math.max(1, subscriber.planPrice))
  );

  const palette = isHero
    ? HERO_GRADIENT
    : GRADIENTS[(Number(subscriber.id.replace(/\D/g, "")) || 0) % GRADIENTS.length];

  return (
    <article
      className={cn(
        "on-media relative overflow-hidden rounded-[20px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]",
        isHero ? "p-5" : "p-4"
      )}
      style={{ backgroundImage: palette.bg }}
    >
      {/* Inner glow (top-left highlight) */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: palette.glow }} />

      {/* Subtle dot texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      {/* Big glossy heart on the right */}
      <ShinyHeart className={isHero ? "size-32 -top-3 -right-4" : "size-24 -top-2 -right-3"} />

      {/* Rank pill on hero */}
      {isHero && rank ? (
        <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/35 backdrop-blur-md text-white text-[10px] font-bold tracking-wide px-2.5 py-1">
          #{rank}
        </span>
      ) : null}

      <div className="relative z-10 flex flex-col gap-3">
        {/* Avatar + Top Spender pill */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full bg-neutral-900/70 backdrop-blur text-white font-bold shrink-0 ring-2 ring-white/25",
              isHero ? "text-[15px]" : "text-[13px]"
            )}
            style={{
              width: isHero ? 48 : 40,
              height: isHero ? 48 : 40,
            }}
          >
            {initials(subscriber.name)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-black/35 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-1">
            <span className="size-1 rounded-full bg-white/80" />
            Top Spender
          </span>
        </div>

        {/* Name + handle */}
        <div className="min-w-0">
          <div
            className={cn(
              "text-white font-bold truncate",
              isHero ? "text-[17px]" : "text-[14px]"
            )}
          >
            {subscriber.name}
          </div>
          <div
            className={cn(
              "text-white/90 truncate mt-0.5 flex items-center gap-0.5",
              isHero ? "text-[13px]" : "text-[11px]"
            )}
          >
            @{subscriber.username}
            <ChevronRight className="size-3 opacity-80" />
          </div>
        </div>

        {/* Stats */}
        <div
          className={cn(
            "flex items-center pt-1 text-white",
            isHero ? "gap-4 text-[12px]" : "gap-2 text-[10px] justify-between"
          )}
        >
          <StatBadge
            icon={<Lock className="size-3" fill="currentColor" strokeWidth={0} />}
            label="Subs"
            value={String(subsCount)}
          />
          <StatBadge
            icon={<Users className="size-3" fill="currentColor" strokeWidth={0} />}
            label="Spent"
            value={formatNaira(subscriber.totalSpent, { compact: true })}
          />
        </div>
      </div>
    </article>
  );
}

function StatBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 font-semibold whitespace-nowrap min-w-0">
      <span className="inline-flex items-center justify-center size-4 rounded-full bg-black/35 backdrop-blur-md text-white shrink-0">
        {icon}
      </span>
      <span className="uppercase tracking-[0.06em]">{label}</span>
      <span className="font-bold tracking-tight">{value}</span>
    </span>
  );
}

/**
 * Layered glossy heart: dark base for depth, mid tint, and a bright top layer
 * with a shine highlight. Purely SVG so it scales cleanly.
 */
function ShinyHeart({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      className={cn("absolute pointer-events-none", className)}
    >
      <defs>
        <linearGradient id="sc-heart-shadow" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.28)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.05)" />
        </linearGradient>
        <linearGradient id="sc-heart-mid" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
        <linearGradient id="sc-heart-highlight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {/* soft outer shadow */}
      <path
        d="M60 108c-4 0-8-1-11-4-8-6-33-25-33-51 0-15 12-27 27-27 8 0 15 3 20 9 5-6 12-9 20-9 15 0 27 12 27 27 0 26-25 45-33 51-3 3-7 4-10 4z"
        fill="url(#sc-heart-shadow)"
      />
      {/* mid heart */}
      <path
        d="M60 104c-3 0-6-1-9-3-8-6-30-23-30-47 0-13 10-22 22-22 7 0 13 3 17 8 4-5 10-8 17-8 12 0 22 9 22 22 0 24-22 41-30 47-3 2-6 3-9 3z"
        fill="url(#sc-heart-mid)"
      />
      {/* top-left shine */}
      <ellipse
        cx="42"
        cy="42"
        rx="10"
        ry="16"
        fill="url(#sc-heart-highlight)"
        transform="rotate(-30 42 42)"
      />
      {/* small sparkle */}
      <circle cx="34" cy="30" r="2.5" fill="rgba(255,255,255,0.9)" />
      <circle cx="78" cy="52" r="1.6" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}
