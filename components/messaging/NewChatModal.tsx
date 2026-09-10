"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";
import { messages } from "@/services/modules/messages";
import { discover } from "@/services/modules/discover";
import { ApiError } from "@/services/apiClient";
import { useMessagingStore } from "@/services/stores/messaging";
import type { ExploreCreatorOut } from "@/services/dtos";
import { cn } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

type Props = {
  basePath: "/messages" | "/dashboard/messages";
  onClose: () => void;
};

/**
 * "Start a new chat" modal. Shows discover.explore() results as a starter
 * list and filters client-side against @username / displayName. Enter on the
 * search input treats the query as a raw username and starts the conv.
 */
export function NewChatModal({ basePath, onClose }: Props) {
  const router = useRouter();
  const conversations = useMessagingStore((s) => s.conversations);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ExploreCreatorOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await discover.explore({ sort: "subs", limit: 20 });
        if (cancelled) return;
        setSuggestions(res.items);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const q = query.trim().toLowerCase().replace(/^@/, "");

  const results = useMemo(() => {
    if (!q) return suggestions;
    return suggestions.filter((c) => {
      const name = (c.displayName ?? "").toLowerCase();
      return c.username.toLowerCase().includes(q) || name.includes(q);
    });
  }, [q, suggestions]);

  const startChat = async (username: string) => {
    if (busy) return;
    setBusy(username);
    // Short-circuit if we already have a conversation with this user.
    const existing = Object.values(conversations).find(
      (c) => c.other.username === username
    );
    if (existing) {
      router.push(`${basePath}/${existing.id}`);
      onClose();
      setBusy(null);
      return;
    }
    try {
      const conv = await messages.startConversation({
        withUsername: username,
      });
      router.push(`${basePath}/${conv.id}`);
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "self_message") toast.error("You can't message yourself.");
        else if (e.code === "blocked")
          toast.error("You can't message this user.");
        else if (e.code === "user_not_found")
          toast.error(`No user @${username}.`);
        else toast.error(e.detail ?? e.message);
      }
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q) return;
    // If the query matches a listed suggestion, pick that. Otherwise treat as
    // a raw username lookup.
    const match = results.find((c) => c.username.toLowerCase() === q);
    startChat(match?.username ?? q);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-label="New chat"
        className="relative w-full max-w-md rounded-[20px] overflow-hidden surface-card flex flex-col max-h-[80dvh]"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-white">New chat</h2>
            <p className="text-[12px] text-white/55 mt-0.5">
              Search for a creator or follower to start chatting.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center size-8 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by @username or name…"
              className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-sm text-white placeholder:text-white/40 pl-10 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
            />
          </div>
        </form>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {loading ? (
            <ul>
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <SkeletonCircle size={40} />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-32 rounded-full" />
                    <Skeleton className="h-2.5 w-20 rounded-full" />
                  </div>
                </li>
              ))}
            </ul>
          ) : results.length === 0 ? (
            <div className="text-center text-sm text-white/55 py-8 px-4">
              {q ? (
                <>
                  Nothing matched <span className="text-white">@{q}</span>. Press
                  Enter to try messaging them anyway.
                </>
              ) : (
                "No suggestions right now."
              )}
            </div>
          ) : (
            <ul>
              {results.map((c) => {
                const name = c.displayName || c.username;
                const isBusy = busy === c.username;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => startChat(c.username)}
                      disabled={!!busy}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] hover:bg-white/[0.05] transition-colors text-left disabled:opacity-60"
                      )}
                    >
                      <Avatar
                        name={name}
                        gradient={BRAND_GRADIENT}
                        image={c.avatarUrl ?? undefined}
                        size={40}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-[14px] font-semibold text-white truncate">
                            {name}
                          </span>
                          {c.verified ? <VerifiedBadge /> : null}
                        </div>
                        <div className="text-[11px] text-white/55 truncate">
                          @{c.username}
                        </div>
                      </div>
                      {isBusy ? (
                        <span
                          aria-hidden
                          className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                        />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
