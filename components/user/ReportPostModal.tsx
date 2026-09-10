"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { posts as postsApi } from "@/services/modules/posts";
import { ApiError } from "@/services/apiClient";
import type { ReportReason } from "@/services/dtos";
import { cn } from "@/lib/utils";

const REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: "spam", label: "Spam", description: "Repetitive or unwanted promotion" },
  { value: "harassment", label: "Harassment", description: "Threats or targeted abuse" },
  { value: "csam", label: "CSAM", description: "Child sexual abuse material" },
  { value: "impersonation", label: "Impersonation", description: "Pretending to be someone else" },
  { value: "nudity_minor", label: "Nudity of a minor", description: "Sexual content involving anyone under 18" },
  { value: "copyright", label: "Copyright", description: "Uses my work without permission" },
  { value: "other", label: "Something else", description: "Doesn't fit the categories above" },
];

export function ReportPostModal({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await postsApi.report(postId, { reason, detail: detail.trim() || undefined });
      toast.success("Report submitted. Thanks — we'll take a look.");
      onClose();
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail ?? e.message : "Couldn't submit report.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={submitting ? undefined : onClose}
      />
      <div className="relative w-full max-w-md surface-card p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center size-10 rounded-full bg-red-500/15 text-red-300 shrink-0">
            <Flag className="size-4" />
          </span>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Report post</h3>
            <p className="text-sm text-white/60 mt-1">
              Reports are anonymous. We&apos;ll review this quickly.
            </p>
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-medium text-white/70 mb-1">Reason</legend>
          {REASONS.map((r) => {
            const selected = reason === r.value;
            return (
              <label
                key={r.value}
                className={cn(
                  "flex items-start gap-3 rounded-[12px] p-3 cursor-pointer transition-colors border",
                  selected
                    ? "bg-gradient-brand-soft border-white/20"
                    : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                )}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={selected}
                  onChange={() => setReason(r.value)}
                  className="mt-1 accent-[#6929FC]"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white">{r.label}</span>
                  <span className="text-xs text-white/55">{r.description}</span>
                </div>
              </label>
            );
          })}
        </fieldset>

        <Textarea
          label={`Add details (optional, ${detail.length}/500)`}
          placeholder="Anything else moderators should know?"
          value={detail}
          onChange={(e) => setDetail(e.target.value.slice(0, 500))}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.05]">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="!bg-red-500 !text-white hover:!bg-red-500/90"
            onClick={submit}
            disabled={!reason || submitting}
          >
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </div>
    </div>
  );
}
