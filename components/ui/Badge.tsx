import { BadgeCheck } from "lucide-react";
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

/**
 * Scallop-shape verified checkmark (lucide `BadgeCheck`) — matches the
 * verified marks used on explore tiles and the admin users list, so the
 * badge visual is consistent everywhere.
 *
 * `active=false` renders the same shape in a muted grey — a "reserved slot"
 * that signals "verification available but not earned yet".
 */
export function VerifiedBadge({
  className,
  active = true,
}: {
  className?: string;
  active?: boolean;
}) {
  return (
    <BadgeCheck
      aria-label={active ? "Verified" : "Not verified"}
      className={cn(
        "size-3.5 shrink-0",
        active ? "text-[#FD23A7]" : "text-white/30",
        className
      )}
      fill="currentColor"
      stroke={active ? "#0B0B12" : "#0B0B12"}
      strokeWidth={2}
    />
  );
}
