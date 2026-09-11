import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Creator } from "@/lib/mock-data";
import { formatCompact, formatNaira } from "@/lib/utils";

export function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <div className="group surface-card overflow-hidden flex flex-col transition-all duration-200 hover:border-white/15 hover:-translate-y-0.5">
      <Link
        href={`/creator/${creator.username}`}
        className="relative block h-32 w-full overflow-hidden bg-neutral-900"
      >
        {creator.image ? (
          <Image
            src={creator.image}
            alt={creator.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundImage: creator.coverGradient }}
          />
        )}
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(1200px 200px at 20% 10%, rgba(255,255,255,0.35), transparent 60%)",
          }}
        />
      </Link>
      <div className="px-5 -mt-8 flex flex-col gap-3">
        <div className="flex items-end justify-between">
          <Link href={`/creator/${creator.username}`}>
            <Avatar
              name={creator.name}
              gradient={creator.avatarGradient}
              image={creator.image}
              size={64}
              ring
            />
          </Link>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] hairline px-2.5 py-1">
            <Users className="size-3 text-white/60" />
            <span className="text-[11px] text-white/70 font-medium">
              {formatCompact(creator.subscribers)}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={`/creator/${creator.username}`}
              className="font-semibold text-white truncate hover:underline underline-offset-2"
            >
              {creator.name}
            </Link>
            <VerifiedBadge active={creator.verified} />
          </div>
          <span className="text-xs text-white/50 truncate">@{creator.username}</span>
        </div>
        <p className="text-sm text-white/70 line-clamp-2 min-h-[2.5rem]">{creator.bio}</p>
      </div>
      <div className="p-5 pt-4 mt-auto flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase text-white/45 tracking-wider">Monthly</span>
          <span className="text-sm font-semibold text-white">
            {formatNaira(creator.monthlyPrice)}
          </span>
        </div>
        <Button href={`/creator/${creator.username}`} size="sm">
          Subscribe
        </Button>
      </div>
    </div>
  );
}
