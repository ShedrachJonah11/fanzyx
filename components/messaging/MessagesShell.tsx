"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { ConversationList } from "@/components/messaging/ConversationList";
import { StartConversationRedirect } from "@/components/messaging/StartConversationRedirect";
import { cn } from "@/lib/utils";

type Props = {
  basePath: "/messages" | "/dashboard/messages";
  variant?: "fan" | "creator";
  children: React.ReactNode;
};

/**
 * Split-view shell shared by fan + creator messaging routes.
 * - Desktop (lg+): conversation list on the left, thread (or placeholder)
 *   on the right — both always visible.
 * - Mobile: single panel that swaps based on the route.
 *   - Base path (list route) → list.
 *   - `/…/[convId]` (thread route) → thread; the list is hidden.
 */
export function MessagesShell({ basePath, variant = "creator", children }: Props) {
  const pathname = usePathname();
  // `inThread` = we're on the [convId] child route, not the base list route.
  const inThread = pathname !== basePath && pathname !== `${basePath}/`;
  // Extract the active conv id from the URL (last segment after basePath).
  const activeConvId = inThread
    ? pathname.slice(basePath.length + 1).split("/")[0] || undefined
    : undefined;

  return (
    <DashboardShell variant={variant}>
      <Suspense fallback={null}>
        <StartConversationRedirect basePath={basePath} />
      </Suspense>
      {/* Cancel the shell's padding on all sides so messaging fills its slot
          edge-to-edge on both mobile and desktop. When we're in a specific
          thread on mobile, the shell hides its top-bar + bottom-nav — so we
          reclaim the full viewport and drop the negative bottom margin
          (which was there to cancel the bottom-nav gutter). */}
      <div
        className={cn(
          "-mx-4 sm:-mx-6 lg:-mx-8 -my-6 lg:-my-8 lg:-mb-8 flex min-h-[520px]",
          inThread
            ? "h-[100dvh] mb-0"
            : "h-[calc(100dvh-4rem)] -mb-24 lg:h-[100dvh]"
        )}
      >
        {/* Conversation list */}
        <aside
          className={cn(
            "w-full lg:w-[340px] xl:w-[380px] shrink-0 lg:border-r border-white/[0.06] flex flex-col min-h-0",
            inThread && "hidden lg:flex"
          )}
        >
          <ConversationList basePath={basePath} activeConvId={activeConvId} />
        </aside>

        {/* Thread slot / empty state */}
        <section
          className={cn(
            "flex-1 min-w-0 flex flex-col min-h-0",
            !inThread && "hidden lg:flex"
          )}
        >
          {inThread ? children : <EmptyThread />}
        </section>
      </div>
    </DashboardShell>
  );
}

function EmptyThread() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
      <span className="inline-flex items-center justify-center size-14 rounded-full bg-white/[0.05] hairline text-white/70">
        <MessageCircle className="size-6" />
      </span>
      <div>
        <h3 className="text-white font-semibold text-[15px]">
          Select a conversation
        </h3>
        <p className="text-sm text-white/55 mt-1 max-w-xs">
          Pick a chat on the left, or start a new one from a profile.
        </p>
      </div>
    </div>
  );
}
