import { Bookmark } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { PostCard } from "@/components/PostCard";
import { getCreator, posts } from "@/lib/mock-data";

export default function BookmarksPage() {
  const bookmarked = posts.filter((p) => p.status === "published").slice(0, 3);

  return (
    <DashboardShell
      title="Bookmarks"
      subtitle="Posts you've saved from your dashboard or the community."
    >
      {bookmarked.length === 0 ? (
        <div className="surface-card p-14 text-center flex flex-col items-center gap-3">
          <div className="size-12 rounded-full bg-white/[0.05] hairline flex items-center justify-center">
            <Bookmark className="size-5 text-white/70" />
          </div>
          <h3 className="text-lg font-semibold text-white">No bookmarks yet</h3>
          <p className="text-sm text-white/55 max-w-sm">
            Tap the bookmark icon on any post to save it here for later.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {bookmarked.map((p) => {
            const c = getCreator(p.creatorUsername);
            if (!c) return null;
            return <PostCard key={p.id} post={p} creator={c} />;
          })}
        </div>
      )}
    </DashboardShell>
  );
}
