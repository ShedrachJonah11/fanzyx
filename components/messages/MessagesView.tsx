"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Heart,
  Image as ImageIcon,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Pin,
  Plus,
  Search,
  SendHorizontal,
  Smile,
  Video,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/Badge";
import {
  conversations as allConversations,
  messagesFor,
  type Conversation,
  type Message,
} from "@/lib/mock-data";
import { useAuth } from "@/services/context";
import { cn } from "@/lib/utils";

const BRAND_GRADIENT =
  "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

type Filter = "all" | "unread" | "pinned";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "pinned", label: "Pinned" },
];

export function MessagesView() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConv = activeId
    ? allConversations.find((c) => c.id === activeId) ?? null
    : null;
  const msgs = activeConv ? messagesFor[activeConv.id] ?? [] : [];

  const filteredConvs = useMemo(() => {
    let arr = allConversations;
    if (filter === "unread") arr = arr.filter((c) => c.unread > 0);
    else if (filter === "pinned") arr = arr.filter((c) => c.pinned);
    if (q.trim()) {
      const s = q.toLowerCase();
      arr = arr.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.username.toLowerCase().includes(s) ||
          c.lastMessage.toLowerCase().includes(s)
      );
    }
    // Pinned first, then most recent
    return [...arr].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
  }, [q, filter]);

  const unreadCount = allConversations.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0);
  const pinnedCount = allConversations.filter((c) => c.pinned).length;

  // Auto-scroll to bottom when opening a chat
  useEffect(() => {
    if (!activeId) return;
    const el = scrollRef.current;
    if (!el) return;
    // Defer to next tick so content is mounted
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [activeId]);

  return (
    <div className="surface-card overflow-hidden grid md:grid-cols-[340px_1fr] h-[calc(100dvh-184px)] lg:h-[calc(100dvh-56px)]">
      {/* Conversation list */}
      <aside
        className={cn(
          "flex-col border-r border-white/[0.05] min-h-0",
          activeId ? "hidden md:flex" : "flex"
        )}
      >
        <div className="p-3 border-b border-white/[0.05] flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search messages"
              className="w-full h-10 rounded-[12px] bg-white/[0.04] hairline text-sm text-white placeholder:text-white/40 pl-10 pr-4 outline-none focus:border-white/20"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] hairline">
            {FILTERS.map((f) => {
              const active = f.value === filter;
              const badge =
                f.value === "unread" ? unreadCount : f.value === "pinned" ? pinnedCount : 0;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "flex-1 h-7 rounded-full text-[12px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors",
                    active
                      ? "bg-gradient-brand text-white"
                      : "text-white/60 hover:text-white/90"
                  )}
                >
                  {f.label}
                  {badge > 0 ? (
                    <span
                      className={cn(
                        "text-[10px] rounded-full px-1.5",
                        active ? "bg-white/25 text-white" : "bg-white/[0.06] text-white/60"
                      )}
                    >
                      {badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto min-h-0">
          {filteredConvs.length === 0 ? (
            <li className="p-8 text-center text-sm text-white/55">
              No conversations here.
            </li>
          ) : (
            filteredConvs.map((c) => (
              <ConversationItem
                key={c.id}
                conv={c}
                active={c.id === activeId}
                onSelect={() => setActiveId(c.id)}
              />
            ))
          )}
        </ul>
      </aside>

      {/* Chat panel */}
      <section
        className={cn(
          "flex-col min-w-0 min-h-0",
          activeId ? "flex" : "hidden md:flex"
        )}
      >
        {activeConv ? (
          <>
            <ChatHeader
              conv={activeConv}
              onBack={() => setActiveId(null)}
            />

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-2 min-h-0"
            >
              {groupMessages(msgs).map((group, gi) => (
                <MessageGroup
                  key={gi}
                  group={group}
                  conv={activeConv}
                />
              ))}
              {activeConv.typing ? (
                <div className="flex items-end gap-2 mt-1">
                  <Avatar
                    name={activeConv.name}
                    gradient={activeConv.avatarGradient}
                    image={activeConv.image}
                    size={26}
                  />
                  <span className="inline-flex items-center gap-1 rounded-[16px] bg-white/[0.06] px-3 py-2 rounded-bl-[6px]">
                    <TypingDot delay={0} />
                    <TypingDot delay={150} />
                    <TypingDot delay={300} />
                  </span>
                </div>
              ) : null}
            </div>

            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => {
                setDraft("");
              }}
            />
          </>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

/* -------------------- Conversation list item -------------------- */

function ConversationItem({
  conv,
  active,
  onSelect,
}: {
  conv: Conversation;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        onClick={onSelect}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors relative",
          active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
        )}
      >
        {active ? (
          <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-brand" />
        ) : null}
        <div className="relative shrink-0">
          <Avatar
            name={conv.name}
            gradient={conv.avatarGradient}
            image={conv.image}
            size={44}
          />
          {conv.online ? (
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-400 ring-2 ring-[#0E0E14]" />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-sm font-semibold text-white truncate">
                {conv.name}
              </span>
              {conv.verified ? <VerifiedBadge className="!size-3 shrink-0" /> : null}
              {conv.pinned ? (
                <Pin className="size-3 text-white/45 shrink-0 rotate-45" />
              ) : null}
            </div>
            <span
              className={cn(
                "text-[10px] shrink-0",
                conv.unread > 0 ? "text-[#FD23A7] font-semibold" : "text-white/45"
              )}
            >
              {shortTime(conv.time)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span
              className={cn(
                "text-[12px] truncate",
                conv.typing
                  ? "text-[#FD23A7] italic"
                  : conv.unread > 0
                  ? "text-white/90 font-medium"
                  : "text-white/55"
              )}
            >
              {conv.typing ? "typing…" : conv.lastMessage}
            </span>
            {conv.unread > 0 ? (
              <span className="text-[10px] bg-gradient-brand text-white rounded-full min-w-[18px] h-[18px] px-1.5 shrink-0 font-semibold inline-flex items-center justify-center">
                {conv.unread}
              </span>
            ) : null}
          </div>
        </div>
      </button>
    </li>
  );
}

/* -------------------- Chat header -------------------- */

function ChatHeader({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  const [following, setFollowing] = useState(false);
  return (
    <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/[0.05]">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onBack}
          aria-label="Back to conversations"
          className="md:hidden inline-flex items-center justify-center size-9 rounded-full text-white/80 hover:text-white hover:bg-white/[0.06]"
        >
          <ArrowLeft className="size-5" />
        </button>
        <a
          href={`/creator/${conv.username}`}
          className="relative shrink-0"
          aria-label={`View ${conv.name}'s profile`}
        >
          <Avatar
            name={conv.name}
            gradient={conv.avatarGradient}
            image={conv.image}
            size={40}
          />
          {conv.online ? (
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-green-400 ring-2 ring-[#0E0E14]" />
          ) : null}
        </a>
        <div className="flex flex-col min-w-0">
          <a
            href={`/creator/${conv.username}`}
            className="flex items-center gap-1 min-w-0 hover:underline underline-offset-2"
          >
            <span className="text-sm font-semibold text-white truncate">
              {conv.name}
            </span>
            {conv.verified ? <VerifiedBadge className="!size-3 shrink-0" /> : null}
          </a>
          <span className="text-[11px] text-white/55 truncate">
            {conv.typing
              ? "typing…"
              : conv.online
              ? "Online now"
              : `Active ${shortAgo(conv.time)}`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setFollowing((v) => !v)}
          aria-pressed={following}
          className={cn(
            "inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[12px] font-semibold transition-colors",
            following
              ? "bg-white/[0.06] hairline text-white hover:bg-white/[0.1]"
              : "bg-gradient-brand text-white on-media shadow-[0_4px_14px_-4px_rgba(253,35,167,0.55)] hover:opacity-95"
          )}
        >
          <Heart
            className="size-3.5"
            fill={following ? "currentColor" : "none"}
            strokeWidth={2}
          />
          {following ? "Following" : "Follow"}
        </button>
        <HeaderIcon label="Voice call">
          <Phone className="size-4" />
        </HeaderIcon>
        <HeaderIcon label="Video call">
          <Video className="size-4" />
        </HeaderIcon>
        <HeaderIcon label="More">
          <MoreVertical className="size-4" />
        </HeaderIcon>
      </div>
    </header>
  );
}

function HeaderIcon({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center size-9 rounded-full text-white/75 hover:text-white hover:bg-white/[0.06]"
    >
      {children}
    </button>
  );
}

/* -------------------- Message group -------------------- */

type Group = { fromMe: boolean; messages: Message[] };

function groupMessages(messages: Message[]): Group[] {
  const groups: Group[] = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    if (last && last.fromMe === m.fromMe) {
      last.messages.push(m);
    } else {
      groups.push({ fromMe: m.fromMe, messages: [m] });
    }
  }
  return groups;
}

function MessageGroup({ group, conv }: { group: Group; conv: Conversation }) {
  const { fromMe, messages } = group;
  const lastMsg = messages[messages.length - 1];
  const { user } = useAuth();
  const meName = user?.displayName || user?.username || "You";
  return (
    <div className={cn("flex items-end gap-2", fromMe ? "justify-end" : "justify-start")}>
      {!fromMe ? (
        <div className="w-7 shrink-0 self-end">
          <Avatar
            name={conv.name}
            gradient={conv.avatarGradient}
            image={conv.image}
            size={28}
          />
        </div>
      ) : null}
      <div className={cn("flex flex-col gap-1 max-w-[75%]", fromMe ? "items-end" : "items-start")}>
        {messages.map((m, i) => {
          const isFirst = i === 0;
          const isLast = i === messages.length - 1;
          return (
            <div
              key={m.id}
              className={cn(
                "px-3.5 py-2 text-sm leading-relaxed break-words",
                fromMe
                  ? "bg-gradient-brand text-white on-media"
                  : "bg-white/[0.06] text-white/90",
                // rounded corners with grouping
                fromMe
                  ? cn(
                      "rounded-[18px]",
                      isFirst ? "rounded-tr-[18px]" : "rounded-tr-[6px]",
                      isLast ? "rounded-br-[6px]" : "rounded-br-[18px]"
                    )
                  : cn(
                      "rounded-[18px]",
                      isFirst ? "rounded-tl-[18px]" : "rounded-tl-[6px]",
                      isLast ? "rounded-bl-[6px]" : "rounded-bl-[18px]"
                    )
              )}
            >
              {m.text}
            </div>
          );
        })}
        <div
          className={cn(
            "text-[10px] text-white/45 flex items-center gap-1",
            fromMe ? "pr-1" : "pl-1"
          )}
        >
          <span>{shortTime(lastMsg.time)}</span>
          {fromMe && lastMsg.status ? (
            lastMsg.status === "read" ? (
              <CheckCheck className="size-3 text-[#FD23A7]" />
            ) : lastMsg.status === "delivered" ? (
              <CheckCheck className="size-3 text-white/60" />
            ) : (
              <Check className="size-3 text-white/60" />
            )
          ) : null}
        </div>
      </div>
      {fromMe ? (
        <div className="w-7 shrink-0 self-end">
          <Avatar
            name={meName}
            gradient={BRAND_GRADIENT}
            image={user?.avatarUrl ?? undefined}
            size={28}
          />
        </div>
      ) : null}
    </div>
  );
}

/* -------------------- Composer -------------------- */

function Composer({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  const canSend = value.trim().length > 0;
  return (
    <div className="border-t border-white/[0.05] p-3">
      <div className="flex items-end gap-2 bg-white/[0.04] hairline rounded-[18px] p-1.5">
        <button
          type="button"
          aria-label="Add attachment"
          title="Attach"
          className="inline-flex items-center justify-center size-9 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] shrink-0"
        >
          <Plus className="size-4" />
        </button>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder="Write a message…"
          rows={1}
          className="flex-1 bg-transparent outline-none resize-none text-sm text-white placeholder:text-white/40 py-2 max-h-32"
        />
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            aria-label="Attach photo"
            title="Photo"
            className="inline-flex items-center justify-center size-9 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06]"
          >
            <ImageIcon className="size-4" />
          </button>
          <button
            aria-label="Attach file"
            title="File"
            className="hidden sm:inline-flex items-center justify-center size-9 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06]"
          >
            <Paperclip className="size-4" />
          </button>
          <button
            aria-label="Emoji"
            title="Emoji"
            className="hidden sm:inline-flex items-center justify-center size-9 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06]"
          >
            <Smile className="size-4" />
          </button>
          {canSend ? (
            <button
              onClick={onSend}
              aria-label="Send"
              className="on-media inline-flex items-center justify-center size-9 rounded-full bg-gradient-brand text-white shadow-[0_6px_18px_-6px_rgba(253,35,167,0.55)] hover:opacity-95"
            >
              <SendHorizontal className="size-4" />
            </button>
          ) : (
            <button
              aria-label="Voice message"
              title="Voice"
              className="inline-flex items-center justify-center size-9 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06]"
            >
              <Mic className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Empty state -------------------- */

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="size-16 rounded-full bg-gradient-brand-soft border border-white/10 flex items-center justify-center">
        <SendHorizontal className="size-6 text-white/70" />
      </div>
      <h3 className="text-lg font-semibold text-white">Your messages</h3>
      <p className="text-sm text-white/55 max-w-sm">
        Pick a conversation on the left to start messaging, or send a message to your
        favourite creator to say hi.
      </p>
    </div>
  );
}

/* -------------------- Typing dot -------------------- */

function TypingDot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block size-1.5 rounded-full bg-white/70 animate-bounce"
      style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
    />
  );
}

/* -------------------- Utils -------------------- */

function shortTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const same =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (same) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 7) {
    return d.toLocaleDateString(undefined, { weekday: "short" });
  }
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function shortAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
