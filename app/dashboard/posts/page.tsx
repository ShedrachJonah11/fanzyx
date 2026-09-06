"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { currentCreator, getPostsFor } from "@/lib/mock-data";
import { formatCompact, formatNaira, timeAgo } from "@/lib/utils";

export default function PostsPage() {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const all = getPostsFor(currentCreator.username);
  const counts = {
    all: all.length,
    published: all.filter((p) => p.status === "published").length,
    drafts: all.filter((p) => p.status === "draft").length,
    scheduled: all.filter((p) => p.status === "scheduled").length,
  };

  const items = useMemo(() => {
    let list = all;
    if (tab === "published") list = list.filter((p) => p.status === "published");
    if (tab === "drafts") list = list.filter((p) => p.status === "draft");
    if (tab === "scheduled") list = list.filter((p) => p.status === "scheduled");
    if (q.trim()) list = list.filter((p) => p.caption.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [all, tab, q]);

  const tabs = [
    { value: "all", label: "All", count: counts.all },
    { value: "published", label: "Published", count: counts.published },
    { value: "drafts", label: "Drafts", count: counts.drafts },
    { value: "scheduled", label: "Scheduled", count: counts.scheduled },
  ];

  return (
    <DashboardShell
      title="Posts"
      subtitle="Manage your content, drafts, and scheduled posts."
      action={
        <Button href="/dashboard/posts/new" leftIcon={<Plus />}>
          New post
        </Button>
      }
    >
      <div className="flex items-center justify-between gap-4 flex-col sm:flex-row mb-4">
        <Tabs items={tabs} value={tab} onValueChange={setTab} />
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search posts"
            className="w-full h-10 rounded-[10px] bg-white/[0.04] hairline text-sm text-white placeholder:text-white/40 pl-10 pr-4 outline-none focus:border-white/20 focus:bg-white/[0.06]"
          />
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.4fr_140px_100px_100px_120px_120px_40px] gap-4 px-5 py-3 text-[11px] uppercase tracking-wider text-white/45 border-b border-white/[0.05]">
          <div>Post</div>
          <div>Visibility</div>
          <div className="text-right">Views</div>
          <div className="text-right">Likes</div>
          <div className="text-right">Earnings</div>
          <div>Date</div>
          <div />
        </div>
        <ul>
          {items.length === 0 ? (
            <li className="p-10 text-center text-white/55">No posts match your filters.</li>
          ) : (
            items.map((p) => (
              <li
                key={p.id}
                className="grid grid-cols-1 md:grid-cols-[1.4fr_140px_100px_100px_120px_120px_40px] gap-4 px-5 py-4 border-t border-white/[0.05] items-center"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="size-12 rounded-[10px] shrink-0"
                    style={{ backgroundImage: p.mediaGradient }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm text-white/90 line-clamp-1">{p.caption}</div>
                    <div className="text-[11px] text-white/45 md:hidden mt-0.5">
                      {timeAgo(p.timestamp)} ago
                    </div>
                  </div>
                </div>
                <div>
                  {p.locked ? (
                    typeof p.ppvPrice === "number" ? (
                      <Badge variant="warning">PPV · {formatNaira(p.ppvPrice, { compact: true })}</Badge>
                    ) : (
                      <Badge variant="brand">Subscribers</Badge>
                    )
                  ) : (
                    <Badge variant="muted">Free</Badge>
                  )}
                </div>
                <div className="text-sm text-white/80 md:text-right">{formatCompact(p.views)}</div>
                <div className="text-sm text-white/80 md:text-right">{formatCompact(p.likes)}</div>
                <div className="text-sm text-white/80 md:text-right">
                  {p.earnings > 0 ? (
                    <span className="text-green-300">{formatNaira(p.earnings, { compact: true })}</span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
                <div className="text-sm text-white/60 hidden md:block">{timeAgo(p.timestamp)} ago</div>
                <div className="justify-self-end">
                  <button className="inline-flex items-center justify-center size-8 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06]">
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="mt-4 text-xs text-white/45">
        Showing {items.length} of {counts.all} posts.
        <Link href="/dashboard/posts/new" className="ml-2 text-white hover:underline underline-offset-4">
          Create a new post
        </Link>
      </div>
    </DashboardShell>
  );
}
