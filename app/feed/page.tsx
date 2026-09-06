"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { PromoPost } from "@/components/PromoPost";
import { FeedRightRail } from "@/components/feed/FeedRightRail";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { FeaturedCreators } from "@/components/featured/FeaturedCreators";
import {
  creators,
  featuredCreators,
  getCreator,
  platformAuthor,
  posts,
} from "@/lib/mock-data";

const TABS = [
  { value: "following", label: "Following" },
  { value: "for-you", label: "For You" },
];

export default function FeedPage() {
  const [tab, setTab] = useState("following");

  const published = posts.filter(
    (p) => p.status === "published" && p.creatorUsername !== platformAuthor.username
  );
  const byNewest = [...published].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const byPopular = [...published].sort((a, b) => b.likes - a.likes);
  const feedPosts = tab === "following" ? byNewest : byPopular;

  return (
    <DashboardShell variant="fan">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col min-w-0">
          {/* Mobile-only Featured Creators at the top */}
          <div className="lg:hidden mb-5">
            <FeaturedCreators creators={featuredCreators} />
          </div>

          <FeedTabs items={TABS} value={tab} onValueChange={setTab} className="mb-4" />

          <div className="flex flex-col gap-4">
            {feedPosts.map((p) => {
              const c = getCreator(p.creatorUsername);
              if (!c) return null;
              return (
                <PromoPost
                  key={p.id}
                  author={platformAuthor}
                  promoted={c}
                  caption={p.caption}
                  hashtag={c.username}
                  timestamp={p.timestamp}
                  likes={p.likes}
                  comments={p.comments}
                  media={{
                    gradient: p.mediaGradient,
                    kind: p.mediaKind === "audio" ? "image" : p.mediaKind,
                  }}
                />
              );
            })}

            {feedPosts.length === 0 ? (
              <div className="surface-card p-14 text-center text-white/55">
                Nothing here yet.
              </div>
            ) : null}
          </div>
        </div>

        <FeedRightRail creators={creators} />
      </div>
    </DashboardShell>
  );
}
