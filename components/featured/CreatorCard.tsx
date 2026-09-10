import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Heart, Users } from "lucide-react";
import type { FeaturedCreatorOut } from "@/services/dtos";
import { formatCompact } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

export function CreatorCard({ creator }: { creator: FeaturedCreatorOut }) {
  const name = creator.displayName || creator.username;
  const cover = creator.coverUrl;
  const avatar = creator.avatarUrl;
  const href = `/creator/${creator.username}`;

  return (
    <Link
      href={href}
      aria-label={`View ${name}'s profile`}
      className="on-media group relative aspect-[2/3] rounded-[14px] overflow-hidden block bg-neutral-900 transition-transform duration-200 hover:scale-[1.01]"
    >
      {/* Background — real cover if set, otherwise the brand gradient. The
          avatar is NEVER used as the background (it would just be a blown-up
          face behind the same face at the bottom). */}
      {cover ? (
        <Image
          src={cover}
          alt=""
          fill
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 33vw"
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: BRAND_GRADIENT }}
          aria-hidden
        />
      )}

      {/* Bottom gradient for readability */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Bottom content — avatar → name → username → stats, stacked */}
      <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col items-center gap-2">
        <div className="relative size-16 rounded-full overflow-hidden ring-[3px] ring-[#FD23A7]">
          {avatar ? (
            <Image
              src={avatar}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ backgroundImage: BRAND_GRADIENT }}
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0 flex flex-col items-center w-full">
          <div className="flex items-center justify-center gap-1 min-w-0 max-w-full">
            <h3 className="text-white font-bold text-[14px] truncate leading-tight">
              {name}
            </h3>
            {creator.verified ? (
              <BadgeCheck
                aria-label="Verified"
                className="size-3.5 text-[#FD23A7] shrink-0"
                fill="currentColor"
                stroke="#0B0B12"
                strokeWidth={2}
              />
            ) : null}
          </div>
          <p className="text-white text-[11px] font-medium truncate mt-0.5 text-center max-w-full">
            @{creator.username}
          </p>
        </div>

        {/* Stats: likes · followers */}
        <div className="flex items-center justify-between text-white w-full">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="size-4" fill="currentColor" strokeWidth={0} />
            <span className="text-[13px] font-semibold leading-none">
              {formatCompact(creator.totalLikes)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" fill="currentColor" strokeWidth={0} />
            <span className="text-[13px] font-semibold leading-none">
              {formatCompact(creator.followerCount)}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
