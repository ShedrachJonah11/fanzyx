"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft, Check, CheckCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Composer } from "./Composer";
import { ConversationMenu } from "./ConversationMenu";
import { useMessagingStore, type LocalMessage } from "@/services/stores/messaging";
import { messages as messagesApi } from "@/services/modules/messages";
import { ApiError } from "@/services/apiClient";
import { cn, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

type Props = {
  convId: string;
  /** Back-link path — /messages for fans, /dashboard/messages for creators. */
  backPath: "/messages" | "/dashboard/messages";
};

export function ThreadView({ convId, backPath }: Props) {
  const meId = useMessagingStore((s) => s.meId);
  const conv = useMessagingStore((s) => s.conversations[convId]);
  const list = useMessagingStore((s) => s.messagesByConv[convId]);
  const pagination = useMessagingStore((s) => s.messagePagination[convId]);
  const openConversation = useMessagingStore((s) => s.openConversation);
  const loadMoreMessages = useMessagingStore((s) => s.loadMoreMessages);
  const markRead = useMessagingStore((s) => s.markRead);
  const applyPresence = useMessagingStore((s) => s.applyPresence);
  const presenceByUser = useMessagingStore((s) => s.presenceByUser);
  const typing = useMessagingStore((s) => s.typingByConv[convId]);
  const readUpTo = useMessagingStore((s) => s.readUpToByConv[convId]);
  const hydrateConversations = useMessagingStore(
    (s) => s.hydrateConversations
  );

  // Ensure the conv is in the store (in case the user landed directly on this URL).
  useEffect(() => {
    if (!conv) hydrateConversations();
  }, [conv, hydrateConversations]);

  useEffect(() => {
    openConversation(convId);
  }, [convId, openConversation]);

  // Hydrate presence for the peer on mount.
  useEffect(() => {
    if (!conv) return;
    (async () => {
      try {
        const { presence } = await import("@/services/modules/messages");
        const res = await presence.get([conv.other.id]);
        const entry = res[conv.other.id];
        if (entry) applyPresence(conv.other.id, entry);
      } catch {}
    })();
  }, [conv, applyPresence]);

  // Auto-scroll to bottom when a new message lands (only if we were already near the bottom).
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const wasNearBottomRef = useRef(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastMessageId = list?.[list.length - 1]?.id;

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - (el.scrollTop + el.clientHeight);
    wasNearBottomRef.current = distanceFromBottom < 120;
  }, []);

  useLayoutEffect(() => {
    if (!wasNearBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
  }, [lastMessageId]);

  // Mark-read when the last message is visible.
  useEffect(() => {
    const node = bottomRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          markRead(convId);
        }
      },
      { threshold: 0.8 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [convId, markRead, lastMessageId]);

  // Load-more on scroll to top.
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = topSentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMoreMessages(convId);
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [convId, loadMoreMessages]);

  const removeLocalMessage = useMessagingStore((s) => s.removeLocalMessage);
  const resendMessage = useMessagingStore((s) => s.resendMessage);

  const [deleting, setDeleting] = useState<string | null>(null);
  const deleteMessage = async (msg: LocalMessage) => {
    if (deleting) return;
    // Failed / still-sending messages have no server row — remove locally,
    // don't call the API (would 404 with `message_not_found`).
    if (msg.status === "failed" || msg.status === "sending") {
      removeLocalMessage(convId, msg.tempId ?? msg.id);
      return;
    }
    setDeleting(msg.id);
    try {
      await messagesApi.deleteMessage(msg.id);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't delete");
    } finally {
      setDeleting(null);
    }
  };

  const handleResend = (msg: LocalMessage) => {
    if (!msg.tempId && !msg.id) return;
    resendMessage(convId, msg.tempId ?? msg.id);
  };

  const peerPresence = conv ? presenceByUser[conv.other.id] : undefined;
  // Presence of a truthy `typing` state is enough — the store already clears
  // it on the 4s expiry timer.
  const isTyping = !!typing && typing.userId !== meId;

  const bubbles = useMemo(() => list ?? [], [list]);
  const peerName = conv?.other.displayName || conv?.other.username || "";

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-white/[0.08] shrink-0">
        <Link
          href={backPath}
          className="lg:hidden inline-flex items-center justify-center size-9 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06]"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="size-4" />
        </Link>
        {conv ? (
          <>
            <div className="relative shrink-0">
              <Avatar
                name={peerName}
                gradient={BRAND_GRADIENT}
                image={conv.other.avatarUrl ?? undefined}
                size={40}
              />
              {peerPresence?.online ? (
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-400 ring-2 ring-[var(--bg-elev)]" />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  href={`/creator/${conv.other.username}`}
                  className="text-[14px] font-semibold text-white truncate hover:underline underline-offset-2"
                >
                  {peerName}
                </Link>
                {conv.other.verified ? <VerifiedBadge /> : null}
              </div>
              <div className="text-[11px] text-white/55">
                {isTyping
                  ? "typing…"
                  : peerPresence?.online
                  ? "Online"
                  : peerPresence?.lastSeenAt
                  ? `Last seen ${timeAgo(peerPresence.lastSeenAt)}`
                  : `@${conv.other.username}`}
              </div>
            </div>
            <ConversationMenu conv={conv} variant="header" />
          </>
        ) : (
          <div className="flex-1 flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-3 w-32 rounded-full" />
              <Skeleton className="h-2.5 w-20 rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 min-h-0"
      >
        {pagination?.hasMore ? (
          <div ref={topSentinelRef} className="flex justify-center py-2">
            {pagination.loading ? (
              <span
                aria-hidden
                className="size-4 rounded-full border-2 border-white/20 border-t-white/70 animate-spin"
              />
            ) : null}
          </div>
        ) : null}

        {!pagination?.loaded && !list ? (
          <ThreadSkeleton />
        ) : bubbles.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-white/40">
            No messages yet — say hi.
          </div>
        ) : (
          bubbles.map((m) => (
            <MessageBubble
              key={m.tempId ?? m.id}
              msg={m}
              meId={meId}
              readUpTo={readUpTo}
              onDelete={() => deleteMessage(m)}
              onResend={() => handleResend(m)}
              deleting={deleting === m.id}
            />
          ))
        )}

        {isTyping ? <TypingBubble /> : null}

        <div ref={bottomRef} className="h-px w-full" />
      </div>

      {/* Composer */}
      <div className="border-t border-white/[0.05] p-3 shrink-0">
        <Composer convId={convId} />
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  meId,
  readUpTo,
  onDelete,
  onResend,
  deleting,
}: {
  msg: LocalMessage;
  meId: string | null;
  readUpTo: string | undefined;
  onDelete: () => void;
  onResend: () => void;
  deleting: boolean;
}) {
  const isMine = msg.fromUserId === meId;
  const deleted = !!msg.deletedAt;
  const failed = msg.status === "failed";

  // Compute status for own messages if not already set.
  let status = msg.status;
  if (isMine && !status) {
    if (readUpTo && msg.id <= readUpTo) status = "read";
    else status = "sent";
  }

  return (
    <div
      className={cn(
        "flex flex-col max-w-[75%] gap-1 group",
        isMine ? "items-end self-end" : "items-start self-start"
      )}
    >
      <div
        className={cn(
          "px-3.5 py-2 rounded-[16px] text-[14px] leading-relaxed break-words whitespace-pre-wrap",
          isMine
            ? "bg-gradient-brand text-white on-media rounded-br-sm"
            : "bg-white/[0.06] hairline text-white rounded-bl-sm",
          deleted && "italic opacity-60"
        )}
      >
        {deleted ? "Message deleted" : msg.body || " "}
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-white/40">
        <span>{timeAgo(msg.createdAt)}</span>
        {isMine && !deleted ? (
          <StatusTicks status={status} />
        ) : null}
        {isMine && failed ? (
          <button
            type="button"
            onClick={onResend}
            className="text-[#FD5CC9] font-semibold hover:text-white"
          >
            Resend
          </button>
        ) : null}
        {isMine && !deleted ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className={cn(
              "hover:text-red-300 transition-opacity",
              failed
                ? "opacity-70"
                : "opacity-0 group-hover:opacity-100 focus:opacity-100"
            )}
          >
            {deleting ? "Deleting…" : failed ? "Discard" : "Delete"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function StatusTicks({ status }: { status?: string }) {
  if (status === "sending") {
    return (
      <span
        aria-label="Sending"
        className="inline-block size-2 rounded-full border border-white/40 border-t-transparent animate-spin"
      />
    );
  }
  if (status === "failed") {
    return <span className="text-red-300 font-semibold">Failed</span>;
  }
  if (status === "read") {
    return <CheckCheck className="size-3 text-[#FD5CC9]" aria-label="Read" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="size-3 text-white/60" aria-label="Delivered" />;
  }
  return <Check className="size-3 text-white/40" aria-label="Sent" />;
}

function ThreadSkeleton() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "flex",
            i % 2 === 0 ? "justify-start" : "justify-end"
          )}
        >
          <Skeleton
            className={cn(
              "h-8 rounded-[16px]",
              i % 2 === 0 ? "w-2/5" : "w-1/3"
            )}
          />
        </div>
      ))}
    </>
  );
}

function TypingBubble() {
  return (
    <div
      className="self-start flex items-center gap-1.5 px-4 py-3 rounded-[16px] rounded-bl-sm bg-white/[0.06] hairline text-white/70 typing-dots"
      aria-label="Peer is typing"
      role="status"
    >
      <span />
      <span />
      <span />
    </div>
  );
}
