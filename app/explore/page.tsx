"use client";

import { useMemo, useState } from "react";
import { Navbar } from "@/components/shell/Navbar";
import { Footer } from "@/components/shell/Footer";
import { CreatorCard } from "@/components/CreatorCard";
import { SearchBar } from "@/components/ui/SearchBar";
import { CategoryFilter } from "@/components/ui/CategoryFilter";
import { Tabs } from "@/components/ui/Tabs";
import { categories, creators } from "@/lib/mock-data";

const FILTERS = ["All", ...categories] as const;
const TABS = [
  { value: "trending", label: "Trending" },
  { value: "popular", label: "Popular" },
  { value: "new", label: "New" },
];

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof FILTERS)[number]>("All");
  const [tab, setTab] = useState("trending");

  const list = useMemo(() => {
    let arr = creators.slice();
    if (cat !== "All") arr = arr.filter((c) => c.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.username.toLowerCase().includes(s) ||
          c.bio.toLowerCase().includes(s)
      );
    }
    if (tab === "popular") arr.sort((a, b) => b.subscribers - a.subscribers);
    else if (tab === "new") arr.sort((a, b) => Number(b.id) - Number(a.id));
    else
      arr.sort(
        (a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.subscribers - a.subscribers
      );
    return arr;
  }, [q, cat, tab]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-24">
        <div className="flex flex-col gap-2 mb-8">
          <span className="text-xs uppercase tracking-widest text-white/45">Explore</span>
          <h1 className="text-3xl sm:text-[40px] font-semibold tracking-tight text-white">
            Discover creators
          </h1>
          <p className="text-white/60">Find creators worth following.</p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <SearchBar
            value={q}
            onChange={setQ}
            placeholder="Search creators by name, handle, or bio…"
          />
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <Tabs items={TABS} value={tab} onValueChange={setTab} />
            <span className="text-xs text-white/45">
              {list.length} {list.length === 1 ? "creator" : "creators"}
            </span>
          </div>
          <CategoryFilter categories={FILTERS} active={cat} onChange={(v) => setCat(v as typeof cat)} />
        </div>

        {list.length === 0 ? (
          <EmptyState onReset={() => { setQ(""); setCat("All"); }} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {list.map((c) => (
              <CreatorCard key={c.id} creator={c} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="surface-card p-12 flex flex-col items-center text-center gap-3">
      <div className="size-14 rounded-full bg-gradient-brand-soft border border-white/10 flex items-center justify-center text-white/70">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" strokeLinecap="round" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white">No creators found</h3>
      <p className="text-sm text-white/55 max-w-sm">
        Try a different search term or reset your filters to browse everyone.
      </p>
      <button
        onClick={onReset}
        className="mt-2 text-sm text-white/80 hover:text-white underline underline-offset-4"
      >
        Reset filters
      </button>
    </div>
  );
}
