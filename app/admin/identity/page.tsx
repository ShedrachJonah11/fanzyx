"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ShieldX, X } from "lucide-react";
import { admin } from "@/services/modules/admin";
import { ApiError } from "@/services/apiClient";
import type {
  IdentityRejectionCode,
  IdentityReviewDocument,
  IdentityReviewFilter,
  IdentityReviewOut,
} from "@/services/dtos";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";
import { cn, timeAgo } from "@/lib/utils";

const FILTERS: { value: IdentityReviewFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const REJECTION_CODES: { value: IdentityRejectionCode; label: string }[] = [
  { value: "blurry_id", label: "Blurry ID photo" },
  { value: "name_mismatch", label: "Name doesn't match" },
  { value: "expired_doc", label: "Expired document" },
  { value: "selfie_mismatch", label: "Selfie doesn't match ID" },
];

const DOC_TYPE_LABEL: Record<string, string> = {
  bvn: "BVN",
  nin: "NIN",
  drivers_license: "Driver's License",
  passport: "Passport",
};

const DOC_KIND_LABEL: Record<IdentityReviewDocument["kind"], string> = {
  id_front: "ID (front)",
  id_back: "ID (back)",
  selfie: "Selfie",
};

export default function IdentityQueuePage() {
  const [filter, setFilter] = useState<IdentityReviewFilter>("pending");
  const [items, setItems] = useState<IdentityReviewOut[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<IdentityReviewOut | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const reload = useCallback(
    async (nextFilter: IdentityReviewFilter) => {
      setLoading(true);
      setItems([]);
      setCursor(null);
      try {
        const page = await admin.identityList({
          status: nextFilter,
          limit: 20,
        });
        setItems(page.items);
        setCursor(page.nextCursor);
      } catch (e) {
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // Refetch on filter change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload(filter);
  }, [filter, reload]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const page = await admin.identityList({
        status: filter,
        cursor,
        limit: 20,
      });
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, loading, filter]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor || loadingMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore();
    });
    io.observe(node);
    return () => io.disconnect();
  }, [items.length, cursor, loadingMore, loadMore]);

  const openDrawer = async (row: IdentityReviewOut) => {
    // Refetch to renew signed URLs (~10 min TTL). Fall back to cached row on error.
    setSelected(row);
    try {
      const page = await admin.identityList({ status: "all", limit: 50 });
      const fresh = page.items.find((r) => r.userId === row.userId);
      if (fresh) setSelected(fresh);
    } catch {
      // keep the cached row
    }
  };

  const closeDrawer = () => {
    setSelected(null);
    setRejectOpen(false);
  };

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div>
        <h1 className="text-[22px] font-bold text-white">Identity queue</h1>
        <p className="text-sm text-white/60 mt-1">
          Review creator KYC submissions. Approvals auto-publish any hidden posts.
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
              aria-pressed={active}
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
          <RowSkeletons count={5} />
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/50">
            No submissions here.
          </div>
        ) : (
          <ul>
            {items.map((row) => (
              <QueueRow
                key={row.submissionId}
                row={row}
                onClick={() => openDrawer(row)}
              />
            ))}
            {loadingMore ? <RowSkeletons count={2} /> : null}
            {cursor ? <div ref={sentinelRef} className="h-1" /> : null}
          </ul>
        )}
      </div>

      {selected ? (
        <ReviewDrawer
          row={selected}
          onClose={closeDrawer}
          onApproved={async () => {
            closeDrawer();
            await reload(filter);
          }}
          onRejectClick={() => setRejectOpen(true)}
        />
      ) : null}

      {selected && rejectOpen ? (
        <RejectModal
          row={selected}
          onClose={() => setRejectOpen(false)}
          onDone={async () => {
            setRejectOpen(false);
            closeDrawer();
            await reload(filter);
          }}
        />
      ) : null}
    </div>
  );
}

/* ── Row ────────────────────────────────────────────── */

function QueueRow({
  row,
  onClick,
}: {
  row: IdentityReviewOut;
  onClick: () => void;
}) {
  const name = row.displayName || row.username;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left flex items-center gap-3 px-4 py-3 border-t border-white/[0.05] first:border-t-0 hover:bg-white/[0.03] transition-colors"
      >
        <span
          aria-hidden
          className="size-10 rounded-full bg-white/[0.06] overflow-hidden flex items-center justify-center text-[13px] font-semibold text-white/70 shrink-0"
        >
          {row.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            name.slice(0, 1).toUpperCase()
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[14px] font-semibold text-white truncate">
              {name}
            </span>
            <span className="text-[11px] text-white/45 truncate">
              @{row.username}
            </span>
          </div>
          <div className="text-[11px] text-white/50 truncate mt-0.5">
            {row.email ?? "—"}
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end text-right text-[11px] text-white/60 min-w-[140px]">
          <span className="text-white/85 font-medium">
            {DOC_TYPE_LABEL[row.documentType] ?? row.documentType}
          </span>
          <span className="tabular-nums">···· {row.idNumberLast4}</span>
        </div>
        <StatusChip status={row.status} />
        <span className="text-[11px] text-white/45 shrink-0 tabular-nums w-16 text-right">
          {row.submittedAt ? timeAgo(row.submittedAt) : "—"}
        </span>
      </button>
    </li>
  );
}

function StatusChip({ status }: { status: IdentityReviewOut["status"] }) {
  const tone: Record<IdentityReviewOut["status"], string> = {
    pending: "bg-yellow-500/15 text-yellow-200",
    verified: "bg-green-500/15 text-green-200",
    rejected: "bg-red-500/15 text-red-200",
    none: "bg-white/[0.06] text-white/60",
  };
  return (
    <span
      className={cn(
        "shrink-0 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full",
        tone[status]
      )}
    >
      {status}
    </span>
  );
}

function RowSkeletons({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-t border-white/[0.05] first:border-t-0"
        >
          <SkeletonCircle size={40} />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-40 rounded-full" />
            <Skeleton className="h-2.5 w-56 rounded-full" />
          </div>
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      ))}
    </>
  );
}

/* ── Detail drawer ─────────────────────────────────── */

function ReviewDrawer({
  row,
  onClose,
  onApproved,
  onRejectClick,
}: {
  row: IdentityReviewOut;
  onClose: () => void;
  onApproved: () => void | Promise<void>;
  onRejectClick: () => void;
}) {
  const [approving, setApproving] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);

  const approve = async () => {
    if (approving) return;
    setApproving(true);
    try {
      await admin.identityApprove(row.userId);
      toast.success(`@${row.username} verified. Held posts will auto-publish.`);
      await onApproved();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't approve");
    } finally {
      setApproving(false);
    }
  };

  const canDecide = row.status === "pending";

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        className="relative w-full max-w-[560px] h-full surface-elev overflow-y-auto flex flex-col"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-[var(--bg-elev)]">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-white truncate">
              {row.displayName || row.username}
            </h2>
            <div className="text-[11px] text-white/55 truncate">
              @{row.username}
              {row.email ? ` · ${row.email}` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center size-8 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06]"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 flex flex-col gap-5 p-5">
          <div className="grid grid-cols-3 gap-3">
            {row.documents.map((d) => (
              <button
                key={d.mediaId}
                type="button"
                onClick={() => setViewer(d.url)}
                className="group flex flex-col gap-1.5"
              >
                <span className="relative aspect-[3/4] rounded-[12px] overflow-hidden hairline bg-black block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.url}
                    alt={DOC_KIND_LABEL[d.kind]}
                    className="absolute inset-0 w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                </span>
                <span className="text-[11px] text-white/70 text-center">
                  {DOC_KIND_LABEL[d.kind]}
                </span>
              </button>
            ))}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-[12px] hairline bg-white/[0.03] p-4 text-[13px]">
            <MetaRow label="Country" value={row.country} />
            <MetaRow
              label="Document"
              value={DOC_TYPE_LABEL[row.documentType] ?? row.documentType}
            />
            <MetaRow label="ID last 4" value={row.idNumberLast4} />
            <MetaRow
              label="Submitted"
              value={
                row.submittedAt
                  ? new Date(row.submittedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"
              }
            />
            {row.reviewedAt ? (
              <MetaRow
                label="Reviewed"
                value={new Date(row.reviewedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
            ) : null}
            <MetaRow label="Status" value={<StatusChip status={row.status} />} />
          </dl>

          {row.status === "rejected" && row.rejectionReason ? (
            <div className="rounded-[12px] hairline bg-red-500/10 text-red-200 px-4 py-3 text-sm flex items-start gap-2">
              <ShieldX className="size-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-red-100">
                  Rejected
                  {row.rejectionCode ? ` · ${row.rejectionCode}` : ""}
                </div>
                <div className="mt-0.5">{row.rejectionReason}</div>
              </div>
            </div>
          ) : null}
        </div>

        {canDecide ? (
          <footer className="sticky bottom-0 border-t border-white/[0.06] px-5 py-4 bg-[var(--bg-elev)] flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={onRejectClick}
              disabled={approving}
            >
              Reject
            </Button>
            <Button onClick={approve} disabled={approving} leftIcon={<Check />}>
              {approving ? "Approving…" : "Approve"}
            </Button>
          </footer>
        ) : null}
      </div>

      {viewer ? (
        <FullscreenViewer url={viewer} onClose={() => setViewer(null)} />
      ) : null}
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-white/50 text-[11px] uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-white/85 text-right">{value}</dd>
    </>
  );
}

function FullscreenViewer({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 inline-flex items-center justify-center size-10 rounded-full bg-black/70 text-white hover:bg-black"
      >
        <X className="size-4" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full object-contain"
      />
    </div>
  );
}

/* ── Reject modal ──────────────────────────────────── */

function RejectModal({
  row,
  onClose,
  onDone,
}: {
  row: IdentityReviewOut;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [code, setCode] = useState<IdentityRejectionCode>("blurry_id");
  const [submitting, setSubmitting] = useState(false);

  const valid = reason.trim().length >= 1 && reason.trim().length <= 280;

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await admin.identityReject(row.userId, {
        reason: reason.trim(),
        code,
      });
      toast.success(`@${row.username} was rejected.`);
      await onDone();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't reject");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Reject submission" size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-white/60">
          The reason is shown to <span className="text-white">@{row.username}</span>{" "}
          verbatim.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-white/70">
            Rejection code
          </span>
          <select
            value={code}
            onChange={(e) => setCode(e.target.value as IdentityRejectionCode)}
            className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white px-3 outline-none focus:border-white/25 focus:bg-white/[0.06] appearance-none"
          >
            {REJECTION_CODES.map((o) => (
              <option
                key={o.value}
                value={o.value}
                className="bg-[#1a1a24] text-white"
              >
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-white/70">
            Reason (shown to creator)
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 280))}
            placeholder="Explain briefly what needs to change."
            rows={4}
            className="w-full resize-none rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white placeholder:text-white/40 px-3.5 py-2.5 outline-none focus:border-white/25 focus:bg-white/[0.06]"
          />
          <span className="text-[11px] text-white/45 self-end tabular-nums">
            {reason.length}/280
          </span>
        </label>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || submitting}>
            {submitting ? "Rejecting…" : "Send rejection"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

