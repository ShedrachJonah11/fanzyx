import Image from "next/image";
import { cn, initials } from "@/lib/utils";

type Props = {
  name: string;
  gradient: string;
  image?: string;
  size?: number;
  className?: string;
  ring?: boolean;
};

export function Avatar({
  name,
  gradient,
  image,
  size = 40,
  className,
  ring = false,
}: Props) {
  const dim = `${size}px`;
  const fontSize = Math.round(size * 0.4);

  if (image) {
    return (
      <span
        className={cn(
          "relative inline-block rounded-full overflow-hidden shrink-0 bg-black",
          ring && "ring-2 ring-[#0E0E14]",
          className
        )}
        style={{ width: dim, height: dim }}
        aria-label={name}
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full text-white font-semibold shrink-0 shadow-inner",
        ring && "ring-2 ring-[#0E0E14]",
        className
      )}
      style={{
        width: dim,
        height: dim,
        backgroundImage: gradient,
        fontSize,
        letterSpacing: 0.2,
      }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
