"use client";

import { useEffect, useState } from "react";
import { CreatorCard } from "./CreatorCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { discover } from "@/services/modules/discover";
import { ApiError } from "@/services/apiClient";
import type { FeaturedCreatorOut } from "@/services/dtos";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Preloaded list — skips the fetch. Useful for tests / SSR. */
  creators?: FeaturedCreatorOut[];
  /** Cap on how many creators to fetch. Defaults to 8. */
  limit?: number;
};

export function FeaturedCreators({ className, creators, limit = 8 }: Props) {
  const [items, setItems] = useState<FeaturedCreatorOut[] | null>(
    creators ?? null
  );
  const [loading, setLoading] = useState(!creators);

  useEffect(() => {
    if (creators) return;
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const res = await discover.featured(limit);
        if (cancelled) return;
        setItems(res.items);
      } catch (e) {
        if (cancelled) return;
        // Don't toast — silent empty state is fine for a discovery shelf.
        if (!(e instanceof ApiError)) return;
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [creators, limit]);

  if (!loading && (!items || items.length === 0)) return null;

  return (
    <section className={cn("w-full", className)}>
      <h2 className="text-white font-bold text-[15px] tracking-tight leading-tight mb-3">
        Featured Creators
      </h2>

      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading || !items
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shrink-0 snap-start w-[38%]">
                <Skeleton className="aspect-[2/3] w-full rounded-[14px]" />
              </div>
            ))
          : items.map((c) => (
              <div key={c.id} className="shrink-0 snap-start w-[38%]">
                <CreatorCard creator={c} />
              </div>
            ))}
      </div>
    </section>
  );
}
