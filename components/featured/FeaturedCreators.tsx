import { CreatorCard, type FeaturedCreator } from "./CreatorCard";
import { cn } from "@/lib/utils";

type Props = {
  creators: FeaturedCreator[];
  className?: string;
};

export function FeaturedCreators({ creators, className }: Props) {
  return (
    <section className={cn("w-full", className)}>
      <h2 className="text-white font-bold text-[15px] tracking-tight leading-tight mb-3">
        Featured Creators
      </h2>

      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {creators.map((c, i) => (
          <div
            key={`${c.username}-${i}`}
            className="shrink-0 snap-start w-[38%]"
          >
            <CreatorCard creator={c} />
          </div>
        ))}
      </div>
    </section>
  );
}
