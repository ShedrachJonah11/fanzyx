import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Heart, Users } from "lucide-react";

export type FeaturedCreator = {
  name: string;
  username: string; // includes leading "@"
  image?: string;
  avatar?: string;
  likes: string;
  followers: string;
  videos?: string;
  photos?: string;
  verified?: boolean;
  href?: string;
  /* Fallback backgrounds when image/avatar URLs are not provided */
  coverGradient?: string;
  avatarGradient?: string;
};

export function CreatorCard({ creator }: { creator: FeaturedCreator }) {
  const handle = creator.username.replace(/^@/, "");
  const href = creator.href ?? `/creator/${handle}`;
  const avatarSrc = creator.avatar ?? creator.image;

  return (
    <Link
      href={href}
      aria-label={`View ${creator.name}'s profile`}
      className="on-media group relative aspect-[2/3] rounded-[14px] overflow-hidden block bg-neutral-900 transition-transform duration-200 hover:scale-[1.01]"
    >
      {/* Main image */}
      {creator.image ? (
        <Image
          src={creator.image}
          alt={creator.name}
          fill
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 33vw"
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: creator.coverGradient }}
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
        {/* Circular avatar with brand pink ring — sits directly above the name */}
        <div className="relative size-16 rounded-full overflow-hidden ring-[3px] ring-[#FD23A7]">
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  creator.avatarGradient ?? creator.coverGradient,
              }}
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0 flex flex-col items-center w-full">
          <div className="flex items-center justify-center gap-1 min-w-0 max-w-full">
            <h3 className="text-white font-bold text-[14px] truncate leading-tight">
              {creator.name}
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
            {creator.username.startsWith("@") ? creator.username : `@${creator.username}`}
          </p>
        </div>

        {/* Stats: likes · followers */}
        <div className="flex items-center justify-between text-white w-full">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="size-4" fill="currentColor" strokeWidth={0} />
            <span className="text-[13px] font-semibold leading-none">
              {creator.likes}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-4" fill="currentColor" strokeWidth={0} />
            <span className="text-[13px] font-semibold leading-none">
              {creator.followers}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
