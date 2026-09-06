import { cn } from "@/lib/utils";

type Variant = "default" | "brand" | "success" | "warning" | "danger" | "muted";

const variants: Record<Variant, string> = {
  default: "bg-white/[0.08] text-white/85 border-white/10",
  brand: "bg-gradient-brand-soft text-white border-white/10",
  success: "bg-green-500/15 text-green-300 border-green-500/20",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  danger: "bg-red-500/15 text-red-300 border-red-500/20",
  muted: "bg-white/[0.04] text-white/60 border-white/5",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-gradient-brand text-white shrink-0",
        className
      )}
      style={{ width: 16, height: 16 }}
      aria-label="Verified"
      title="Verified"
    >
      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}
