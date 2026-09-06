"use client";

import { useState } from "react";
import { Calendar, Camera, Film, ImagePlus, Music2, Upload } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { cn, formatNaira } from "@/lib/utils";

type Visibility = "free" | "subscribers" | "ppv";

export default function NewPostPage() {
  const [visibility, setVisibility] = useState<Visibility>("free");
  const [price, setPrice] = useState(3500);
  const [caption, setCaption] = useState("");

  return (
    <DashboardShell title="Create a post" subtitle="Share something new with your fans.">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="surface-card p-5">
            <Textarea
              placeholder="What's on your mind?"
              className="!bg-transparent !border-transparent focus:!border-transparent focus:!bg-transparent p-0 text-[17px] min-h-[100px]"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="surface-card p-5">
            <div className="rounded-[16px] border-2 border-dashed border-white/10 hover:border-white/20 transition-colors p-10 flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center justify-center size-12 rounded-full bg-gradient-brand-soft border border-white/10 text-white/80">
                <Upload className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-[15px] font-medium text-white">
                  Drag & drop photos or videos
                </span>
                <span className="text-xs text-white/50">
                  Up to 25 files. PNG, JPG, MP4, MP3 · Max 500MB
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <MediaButton icon={<ImagePlus className="size-4" />}>Image</MediaButton>
                <MediaButton icon={<Film className="size-4" />}>Video</MediaButton>
                <MediaButton icon={<Music2 className="size-4" />}>Audio</MediaButton>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="surface-card p-5">
            <div className="text-xs uppercase tracking-wider text-white/45 mb-3">
              Post visibility
            </div>
            <div className="flex flex-col gap-2">
              <VisibilityOption
                active={visibility === "free"}
                onClick={() => setVisibility("free")}
                title="Free"
                body="Everyone can see this post."
              />
              <VisibilityOption
                active={visibility === "subscribers"}
                onClick={() => setVisibility("subscribers")}
                title="Subscribers only"
                body="Only active subscribers can access this post."
              />
              <VisibilityOption
                active={visibility === "ppv"}
                onClick={() => setVisibility("ppv")}
                title="Pay-per-view"
                body="Fans pay individually to unlock the post."
              />
            </div>

            {visibility === "ppv" ? (
              <div className="mt-4 flex flex-col gap-1.5">
                <label className="text-xs font-medium text-white/70">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/55">₦</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value) || 0)}
                    className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white pl-8 pr-4 outline-none focus:border-white/25"
                  />
                </div>
                <span className="text-[11px] text-white/45">
                  Fans will pay {formatNaira(price)} to unlock this post.
                </span>
              </div>
            ) : null}
          </div>

          <div className="surface-card p-5 flex flex-col gap-3">
            <div className="text-xs uppercase tracking-wider text-white/45">Schedule</div>
            <button className="flex items-center gap-3 h-11 rounded-[12px] bg-white/[0.04] hairline text-sm text-white/70 hover:bg-white/[0.06] px-4">
              <Calendar className="size-4" /> Publish now
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <Button size="lg" className="w-full">
              Publish post
            </Button>
            <Button variant="secondary" size="md" className="w-full">
              Save as draft
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function MediaButton({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button className="inline-flex items-center gap-1.5 text-xs rounded-full bg-white/[0.05] hairline text-white/80 hover:text-white hover:bg-white/[0.08] h-8 px-3">
      {icon}
      {children}
    </button>
  );
}

function VisibilityOption({
  active,
  onClick,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-[12px] p-3 flex items-start gap-3 transition-all border",
        active
          ? "bg-gradient-brand-soft border-white/15"
          : "border-transparent bg-white/[0.03] hover:bg-white/[0.05]"
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex items-center justify-center size-4 rounded-full border",
          active ? "border-white bg-white" : "border-white/30"
        )}
      >
        {active ? <span className="size-1.5 rounded-full bg-black" /> : null}
      </span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">{title}</span>
        <span className="text-xs text-white/55">{body}</span>
      </div>
    </button>
  );
}
