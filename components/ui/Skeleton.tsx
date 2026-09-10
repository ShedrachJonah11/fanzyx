import { cn } from "@/lib/utils";

/**
 * Shimmering placeholder block. Size and shape are set via `className`
 * — `<Skeleton className="h-4 w-24 rounded-full" />`.
 *
 * Uses `.skeleton-block` (defined in globals.css) so both light and dark
 * themes get an appropriate tint and shimmer, and reduced-motion users
 * see a static block.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("skeleton-block rounded-md", className)}
      {...props}
    />
  );
}

/**
 * Shorthand for stacking N single-line text skeletons. Widths cycle through
 * the provided array so lines look naturally uneven; the last is narrower
 * by default.
 */
export function SkeletonText({
  lines = 2,
  widths = ["100%", "82%", "68%"],
  className,
}: {
  lines?: number;
  widths?: string[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5 rounded-full"
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

/**
 * Circle preset — for avatars.
 */
export function SkeletonCircle({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      className={cn("rounded-full shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}
