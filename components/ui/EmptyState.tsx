import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** Pixel width of the illustration. Height auto-scales from the intrinsic
   *  aspect. Default 200 — fits inside a `.surface-card` row. */
  imageSize?: number;
  /** Override the illustration when a specific empty state wants a different
   *  visual. Defaults to `/Empty-pana.svg`. */
  imageSrc?: string;
};

const DEFAULT_SRC = "/Empty-pana.svg";

/**
 * Illustrated empty-state used across list surfaces (bookmarks, transactions,
 * subscribers, payouts, etc.). Centred stack: illustration → title → body →
 * optional action button.
 */
export function EmptyState({
  title,
  body,
  action,
  className,
  imageSize = 200,
  imageSrc = DEFAULT_SRC,
}: Props) {
  return (
    <div
      className={cn(
        "surface-card p-8 sm:p-12 flex flex-col items-center text-center gap-4",
        className
      )}
    >
      <Image
        src={imageSrc}
        alt=""
        width={imageSize}
        height={imageSize}
        priority={false}
        className="opacity-90"
        style={{ height: "auto", maxWidth: "100%" }}
      />
      <div className="flex flex-col gap-1.5 max-w-sm">
        <h3 className="text-white font-semibold text-[16px]">{title}</h3>
        {body ? (
          <p className="text-sm text-white/55 leading-relaxed">{body}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
