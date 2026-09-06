import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md" | "lg";
  href?: string | null;
  className?: string;
};

const sizes: Record<"sm" | "md" | "lg", { h: number; w: number }> = {
  sm: { h: 22, w: 76 },
  md: { h: 28, w: 97 },
  lg: { h: 44, w: 152 },
};

// SVG wordmarks from the brand kit — public/fanzyx-brand-assets/logo/svg
const GRADIENT_WORDMARK = "/fanzyx-brand-assets/logo/svg/fanzyx-wordmark-gradient.svg";
const BLACK_WORDMARK = "/fanzyx-brand-assets/logo/svg/fanzyx-wordmark-black.svg";

export function Logo({ size = "md", href = "/", className }: Props) {
  const { h, w } = sizes[size];

  const img = (
    <span
      className={cn("inline-flex items-center select-none", className)}
      style={{ height: h }}
    >
      {/* Gradient wordmark — shown on dark mode */}
      <Image
        src={GRADIENT_WORDMARK}
        alt="FanzyX"
        priority
        width={w}
        height={h}
        style={{ height: h, width: "auto" }}
        className="only-dark"
      />
      {/* Black wordmark — shown on light mode */}
      <Image
        src={BLACK_WORDMARK}
        alt="FanzyX"
        priority
        width={w}
        height={h}
        style={{ height: h, width: "auto" }}
        className="only-light"
      />
    </span>
  );

  if (href === null) return img;
  return (
    <Link href={href} className="inline-flex items-center" aria-label="FanzyX home">
      {img}
    </Link>
  );
}
