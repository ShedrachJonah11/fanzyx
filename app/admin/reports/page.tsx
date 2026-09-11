"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { admin } from "@/services/modules/admin";
import { ApiError } from "@/services/apiClient";
import type {
  ReportAction,
  ReportOut,
  ReportStatus,
} from "@/services/dtos";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, timeAgo } from "@/lib/utils";

const FILTERS: { value: ReportStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "actioned", label: "Actioned" },
  { value: "dismissed", label: "Dismissed" },
];

const ACTIONS: { value: ReportAction; label: string }[] = [
  { value: "remove_post", label: "Remove post" },
  { value: "ban_user", label: "Ban user" },
  { value: "dismiss", label: "Dismiss report" },
];

export default function ReportsPage() {
  const [filter, setFilter] = useState<ReportStatus>("open");
  const [items, setItems] = useState<ReportOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<ReportOut | null>(null);

  const reload = useCallback(async (s: ReportStatus) => {
    setLoading(true);
    try {
      const page = await admin.reportsList({ status: s, limit: 30 });
      setItems(page.items);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Refetch on filter change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload(filter);
  }, [filter, reload]);

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div>
        <h1 className="text-[22px] font-bold text-white">Reports</h1>
        <p className="text-sm text-white/60 mt-1">
          Content and user reports awaiting moderator action.
        </p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => {
          const active = f.value === filter;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "inline-flex items-center h-8 px-3.5 rounded-full text-[12px] font-medium transition-colors shrink-0",
                active
                  ? "bg-gradient-brand text-white on-media"
                  : "bg-white/[0.04] hairline text-white/70 hover:bg-white/[0.08]"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-[14px] hairline bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-4 flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-[10px]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/50">
            No reports here.
          </div>
        ) : (
          <ul>
            {items.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 px-4 py-3 border-t border-white/[0.05] first:border-t-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-white truncate">
                    <span className="text-white/50">Reason:</span>{" "}
                    <span className="font-medium">{r.reason}</span>
                  </div>
                  <div className="text-[11px] text-white/55 truncate mt-0.5">
                    <span className="text-white/40">Reporter</span>{" "}
                    @{r.reporter.username}{" "}
                    <span className="text-white/40">· Target</span>{" "}
                    {r.target.href ? (
                      <Link
                        href={r.target.href}
                        target="_blank"
                        className="text-[#FD5CC9] hover:underline"
                      >
                        {r.target.label}
                      </Link>
                    ) : (
                      <span>{r.target.label}</span>
                    )}{" "}
                    <span className="text-white/40 uppercase tracking-wider text-[10px]">
                      {r.target.kind}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-white/45 tabular-nums shrink-0 w-16 text-right">
                  {timeAgo(r.createdAt)}
                </span>
                {r.status === "open" ? (
                  <Button size="sm" onClick={() => setTarget(r)}>
                    Action
                  </Button>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-white/50 px-2 py-0.5 rounded-full bg-white/[0.06]">
                    {r.status}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {target ? (
        <ActionModal
          report={target}
          onClose={() => setTarget(null)}
          onDone={async () => {
            setTarget(null);
            await reload(filter);
          }}
        />
      ) : null}
    </div>
  );
}

function ActionModal({
  report,
  onClose,
  onDone,
}: {
  report: ReportOut;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const [action, setAction] = useState<ReportAction>("dismiss");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await admin.reportAction(report.id, {
        action,
        note: note.trim() || undefined,
      });
      toast.success("Report actioned");
      await onDone();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't action");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Action report" size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-white/60">
          Target: <span className="text-white">{report.target.label}</span>
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-white/70">Action</span>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as ReportAction)}
            className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white px-3 outline-none focus:border-white/25 focus:bg-white/[0.06] appearance-none"
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value} className="bg-[#1a1a24]">
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-white/70">
            Internal note (optional)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            rows={3}
            className="w-full resize-none rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white placeholder:text-white/40 px-3.5 py-2.5 outline-none focus:border-white/25 focus:bg-white/[0.06]"
          />
        </label>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Applying…" : "Apply"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
