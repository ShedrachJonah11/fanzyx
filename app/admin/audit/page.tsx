"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { admin } from "@/services/modules/admin";
import { ApiError } from "@/services/apiClient";
import type { AuditOut } from "@/services/dtos";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminAuditPage() {
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");

  const [debouncedActor, setDebouncedActor] = useState("");
  const [debouncedAction, setDebouncedAction] = useState("");
  const [debouncedEntity, setDebouncedEntity] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedActor(actor.trim()), 300);
    return () => window.clearTimeout(id);
  }, [actor]);
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedAction(action.trim()), 300);
    return () => window.clearTimeout(id);
  }, [action]);
  useEffect(() => {
    const id = window.setTimeout(
      () => setDebouncedEntity(entityType.trim()),
      300
    );
    return () => window.clearTimeout(id);
  }, [entityType]);

  const [rows, setRows] = useState<AuditOut[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const page = await admin.auditList({
        actorUserId: debouncedActor || undefined,
        action: debouncedAction || undefined,
        entityType: debouncedEntity || undefined,
        limit: 50,
      });
      setRows(page.items);
      setCursor(page.nextCursor);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load");
    } finally {
      setLoading(false);
    }
  }, [debouncedActor, debouncedAction, debouncedEntity]);

  useEffect(() => {
    // Refetch when filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await admin.auditList({
        actorUserId: debouncedActor || undefined,
        action: debouncedAction || undefined,
        entityType: debouncedEntity || undefined,
        cursor,
        limit: 50,
      });
      setRows((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, debouncedActor, debouncedAction, debouncedEntity]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor || loadingMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) loadMore();
    });
    io.observe(node);
    return () => io.disconnect();
  }, [rows.length, cursor, loadingMore, loadMore]);

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div>
        <h1 className="text-[22px] font-bold text-white">Audit log</h1>
        <p className="text-sm text-white/60 mt-1">
          Every admin action, in one place.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <FilterInput
          label="Actor user id"
          value={actor}
          onChange={setActor}
          placeholder="01H…"
        />
        <FilterInput
          label="Action"
          value={action}
          onChange={setAction}
          placeholder="identity.approve"
        />
        <FilterInput
          label="Entity type"
          value={entityType}
          onChange={setEntityType}
          placeholder="user | post | report"
        />
      </div>

      <div className="rounded-[14px] hairline bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-[10px]" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/50">
            No audit entries match.
          </div>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-white/45">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-white/[0.05] hover:bg-white/[0.02] align-top"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-white/60 tabular-nums">
                    {new Date(r.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 text-white/85">
                    @{r.actorUsername}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-white/[0.06] text-white/85 font-mono text-[11px]">
                      {r.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    <div>
                      <span className="text-white/50">{r.entityType}</span>{" "}
                      <span className="font-mono text-[11px]">{r.entityId}</span>
                    </div>
                    {r.meta ? (
                      <pre className="mt-1 text-[10px] text-white/45 whitespace-pre-wrap break-all max-w-[360px]">
                        {JSON.stringify(r.meta)}
                      </pre>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-white/50 tabular-nums">
                    {r.ip ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {cursor ? <div ref={sentinelRef} className="h-1" /> : null}
      </div>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-white/70">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white placeholder:text-white/40 px-3 outline-none focus:border-white/25 focus:bg-white/[0.06]"
      />
    </label>
  );
}
