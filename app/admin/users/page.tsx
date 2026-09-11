"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Search, ShieldOff } from "lucide-react";
import { VerifiedBadge } from "@/components/ui/Badge";
import { admin } from "@/services/modules/admin";
import { ApiError } from "@/services/apiClient";
import type { AdminUserOut, Role } from "@/services/dtos";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";
import { cn, timeAgo } from "@/lib/utils";

type RoleFilter = "all" | Role;

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fan", label: "Fans" },
  { value: "creator", label: "Creators" },
  { value: "moderator", label: "Moderators" },
  { value: "admin", label: "Admins" },
];

export default function AdminUsersPage() {
  const [role, setRole] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<AdminUserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<AdminUserOut | null>(null);

  // Debounce the search input so we don't hammer the endpoint per keystroke.
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const page = await admin.usersList({
        role: role === "all" ? undefined : role,
        search: debounced || undefined,
        limit: 30,
      });
      setItems(page.items);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load");
    } finally {
      setLoading(false);
    }
  }, [role, debounced]);

  useEffect(() => {
    // Refetch on filter/search change — legitimate data-fetching effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      <div>
        <h1 className="text-[22px] font-bold text-white">Users</h1>
        <p className="text-sm text-white/60 mt-1">
          Search fans and creators; ban, restore, or promote roles.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by username or email…"
            leftIcon={<Search />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLE_FILTERS.map((f) => {
            const active = f.value === role;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setRole(f.value)}
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
      </div>

      <div className="rounded-[14px] hairline bg-white/[0.03] overflow-hidden">
        {loading ? (
          <div className="p-4 flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonCircle size={36} />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-32 rounded-full" />
                  <Skeleton className="h-2.5 w-48 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/50">
            No users match.
          </div>
        ) : (
          <ul>
            {items.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                onSelect={() => setTarget(u)}
              />
            ))}
          </ul>
        )}
      </div>

      {target ? (
        <UserActionsModal
          user={target}
          onClose={() => setTarget(null)}
          onChanged={async () => {
            setTarget(null);
            await reload();
          }}
        />
      ) : null}
    </div>
  );
}

function UserRow({
  user,
  onSelect,
}: {
  user: AdminUserOut;
  onSelect: () => void;
}) {
  const roleTone: Record<Role, string> = {
    admin: "bg-[#FD23A7]/15 text-[#FD5CC9]",
    moderator: "bg-yellow-500/15 text-yellow-200",
    creator: "bg-[#4340FA]/15 text-[#6EA0FF]",
    fan: "bg-white/[0.06] text-white/70",
  };
  return (
    <li className="flex items-center gap-3 px-4 py-3 border-t border-white/[0.05] first:border-t-0">
      <span className="size-9 rounded-full bg-white/[0.06] flex items-center justify-center text-[13px] font-semibold text-white/70 shrink-0">
        {user.username.slice(0, 1).toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[14px] font-semibold text-white truncate">
            @{user.username}
          </span>
          <VerifiedBadge active={user.verified} />
          {user.deletedAt ? (
            <ShieldOff className="size-3.5 text-red-300 shrink-0" />
          ) : null}
        </div>
        <div className="text-[11px] text-white/55 truncate mt-0.5">
          {user.email ?? "—"}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full",
          roleTone[user.role]
        )}
      >
        {user.role}
      </span>
      <span className="hidden sm:inline text-[11px] text-white/45 shrink-0 w-20 text-right">
        {user.lastActiveAt ? timeAgo(user.lastActiveAt) : "—"}
      </span>
      <button
        type="button"
        onClick={onSelect}
        aria-label="Actions"
        className="inline-flex items-center justify-center size-8 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06]"
      >
        <MoreHorizontal className="size-4" />
      </button>
    </li>
  );
}

function UserActionsModal({
  user,
  onClose,
  onChanged,
}: {
  user: AdminUserOut;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState<"verify" | "ban" | "role" | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState<string>("");
  const [role, setRole] = useState<Role>(user.role);

  const run = useCallback(
    async (
      kind: "verify" | "ban" | "role",
      fn: () => Promise<unknown>
    ) => {
      if (busy) return;
      setBusy(kind);
      try {
        await fn();
        toast.success("Done");
        await onChanged();
      } catch (e) {
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't apply");
      } finally {
        setBusy(null);
      }
    },
    [busy, onChanged]
  );

  const doVerify = () =>
    run("verify", () => admin.userVerify(user.id));
  const doBan = () => {
    if (!banReason.trim()) return;
    const days = banDays.trim() ? Number(banDays) : null;
    if (banDays.trim() && (!Number.isFinite(days) || (days ?? 0) <= 0)) {
      toast.error("Duration must be a positive number of days.");
      return;
    }
    return run("ban", () =>
      admin.userBan(user.id, {
        reason: banReason.trim(),
        durationDays: days,
      })
    );
  };
  const doRole = () => {
    if (role === user.role) return;
    return run("role", () => admin.userRole(user.id, { role }));
  };

  return (
    <Modal open onClose={onClose} title={`@${user.username}`} size="md">
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <h3 className="text-[13px] font-semibold text-white">Verified badge</h3>
          <p className="text-[12px] text-white/55">
            Manually toggles the verified badge (different from identity approval).
          </p>
          <div>
            <Button
              variant="secondary"
              onClick={doVerify}
              disabled={busy !== null}
            >
              {user.verified ? "Toggle badge off" : "Set verified badge"}
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
          <h3 className="text-[13px] font-semibold text-white">Change role</h3>
          <div className="flex items-center gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="flex-1 h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white px-3 outline-none focus:border-white/25 focus:bg-white/[0.06] appearance-none"
            >
              <option value="fan" className="bg-[#1a1a24]">Fan</option>
              <option value="creator" className="bg-[#1a1a24]">Creator</option>
              <option value="moderator" className="bg-[#1a1a24]">Moderator</option>
              <option value="admin" className="bg-[#1a1a24]">Admin</option>
            </select>
            <Button
              onClick={doRole}
              disabled={busy !== null || role === user.role}
            >
              Save
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
          <h3 className="text-[13px] font-semibold text-white">Ban user</h3>
          <Input
            label="Reason"
            placeholder="Visible in the audit log"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <Input
            label="Duration (days)"
            placeholder="Leave blank for permanent"
            value={banDays}
            onChange={(e) => setBanDays(e.target.value)}
            inputMode="numeric"
          />
          <div className="flex items-center justify-end">
            <Button
              onClick={doBan}
              disabled={busy !== null || !banReason.trim()}
              className="bg-red-500/85 hover:bg-red-500"
            >
              {busy === "ban" ? "Banning…" : "Ban user"}
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  );
}
