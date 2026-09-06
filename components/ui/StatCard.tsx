import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
  icon?: React.ReactNode;
  className?: string;
};

export function StatCard({ label, value, delta, positive = true, icon, className }: Props) {
  return (
    <div className={cn("surface-card p-5 flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{label}</span>
        {icon ? (
          <span className="inline-flex items-center justify-center size-8 rounded-full bg-white/[0.05] text-white/70 [&>svg]:size-4">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-3">
        <span className="text-[26px] font-semibold text-white leading-none">{value}</span>
        {delta ? (
          <span
            className={cn(
              "text-xs font-medium rounded-full px-2 py-0.5 border",
              positive
                ? "text-green-300 bg-green-500/10 border-green-500/20"
                : "text-red-300 bg-red-500/10 border-red-500/20"
            )}
          >
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}
