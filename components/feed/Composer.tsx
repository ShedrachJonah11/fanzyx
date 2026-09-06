"use client";

import { useState } from "react";
import {
  ChevronDown,
  ImagePlus,
  ListChecks,
  Lock,
  MoreHorizontal,
  Smile,
  Tag,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { Creator } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Audience = "everyone" | "subscribers" | "ppv";

const audienceLabel: Record<Audience, string> = {
  everyone: "Everyone",
  subscribers: "Subscribers",
  ppv: "Pay-per-view",
};

export function Composer({ author }: { author: Creator }) {
  const [text, setText] = useState("");
  const [audience, setAudience] = useState<Audience>("subscribers");
  const [showMore, setShowMore] = useState(false);
  const canPost = text.trim().length > 0;
  const remaining = 280 - text.length;

  return (
    <div className="surface-card overflow-hidden">
      {/* Header row: avatar + handle */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <Avatar
          name={author.name}
          gradient={author.avatarGradient}
          image={author.image}
          size={36}
        />
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-sm font-semibold text-white truncate">
            {author.name}
          </span>
          <span className="text-[11px] text-white/50 truncate">
            @{author.username}
          </span>
        </div>
      </div>

      {/* Caption */}
      <div className="px-4 pt-3 pb-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 280))}
          placeholder="Add a caption…"
          rows={2}
          className="w-full bg-transparent outline-none text-[15px] text-white placeholder:text-white/40 resize-none leading-relaxed"
        />
      </div>

      {/* Chips */}
      <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
        <Chip icon={<ImagePlus className="size-4" />}>Media</Chip>
        <Chip icon={<ListChecks className="size-4" />}>Poll</Chip>
        <Chip icon={<Tag className="size-4" />}>Tag</Chip>
        <Chip icon={<Lock className="size-4" />}>Lock Content</Chip>
        <button className="ml-auto inline-flex items-center justify-center size-8 rounded-full text-white/55 hover:text-white hover:bg-white/[0.06]">
          <Smile className="size-4" />
        </button>
      </div>

      <div className="divider" />

      {/* Audience selector */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex flex-col leading-tight">
          <span className="text-xs uppercase tracking-wider text-white/45">Audience</span>
        </div>
        <button
          onClick={() =>
            setAudience((a) =>
              a === "everyone" ? "subscribers" : a === "subscribers" ? "ppv" : "everyone"
            )
          }
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] hairline text-sm text-white px-3 h-8 hover:bg-white/[0.08] transition-colors"
        >
          {audienceLabel[audience]}
          <ChevronDown className="size-3.5 text-white/60" />
        </button>
      </div>

      <div className="divider" />

      {/* More options */}
      <button
        onClick={() => setShowMore((v) => !v)}
        className="flex items-center gap-2 px-4 py-3 w-full text-left text-sm text-white/70 hover:text-white transition-colors"
      >
        <MoreHorizontal className="size-4 text-white/60" />
        <span className="flex-1">More options</span>
        <ChevronDown
          className={cn(
            "size-4 text-white/50 transition-transform",
            showMore && "rotate-180"
          )}
        />
      </button>

      {showMore ? (
        <div className="px-4 pb-4 flex flex-col gap-2 text-sm text-white/65">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-[#6929FC]" />
            Schedule for later
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-[#6929FC]" />
            Allow comments
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-[#6929FC]" defaultChecked />
            Send push notification
          </label>
        </div>
      ) : null}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.05]">
        <span
          className={cn(
            "text-[11px] font-medium",
            remaining < 40
              ? remaining < 0
                ? "text-red-400"
                : "text-amber-300"
              : "text-white/45"
          )}
        >
          {remaining} characters
        </span>
        <Button disabled={!canPost || remaining < 0}>Post</Button>
      </div>
    </div>
  );
}

function Chip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/[0.04] hairline text-xs text-white/80 hover:bg-white/[0.08] hover:text-white transition-colors">
      {icon}
      {children}
    </button>
  );
}
