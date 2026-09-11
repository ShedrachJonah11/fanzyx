"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ClipboardList,
  Coins,
  FileClock,
  LayoutDashboard,
  LogOut,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/services/context";
import { cn } from "@/lib/utils";

/**
 * Admin console shell. Server routes are already gated by middleware
 * (no session → /admin/login). This layer adds a role check — only `admin`
 * and `moderator` can proceed past it. The login route lives inside this
 * layout too and bypasses the gate.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginRoute =
    pathname === "/admin/login" || pathname?.startsWith("/admin/login/");
  const isAdmin = user?.role === "admin";
  const isModerator = user?.role === "moderator";
  const isStaff = isAdmin || isModerator;

  useEffect(() => {
    if (isLoginRoute || loading) return;
    if (!user) {
      router.replace("/admin/login");
      return;
    }
    if (!isStaff) {
      router.replace("/");
    }
  }, [isLoginRoute, loading, user, isStaff, router]);

  if (isLoginRoute) return <>{children}</>;

  if (loading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-white/60 text-sm">
        Loading…
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-white/60 text-sm">
        Redirecting…
      </div>
    );
  }

  const nav = NAV.filter((n) => (n.adminOnly ? isAdmin : true));

  const onLogout = async () => {
    try {
      await logout();
      router.replace("/admin/login");
    } catch {
      toast.error("Couldn't sign out");
    }
  };

  return (
    <div className="min-h-dvh bg-[#07070A] text-white flex">
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/[0.06] px-3 py-5 sticky top-0 h-dvh">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 pb-5 font-semibold text-white/90 hover:text-white"
        >
          <ShieldCheck className="size-5 text-[#FD23A7]" />
          <span>FanzyX Admin</span>
        </Link>

        <nav className="flex flex-col gap-0.5 flex-1">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 h-9 px-3 rounded-[10px] text-[13px] font-medium transition-colors",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-white/70 hover:text-white hover:bg-white/[0.05]"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] pt-3 flex flex-col gap-1">
          <div className="px-3 py-1.5">
            <div className="text-[13px] font-medium text-white truncate">
              @{user.username}
            </div>
            <div className="text-[11px] text-white/45 capitalize">
              {user.role}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-2 h-9 px-3 rounded-[10px] text-[13px] font-medium text-white/70 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-white/[0.06]">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 font-semibold text-white/90"
          >
            <ShieldCheck className="size-5 text-[#FD23A7]" />
            Admin
          </Link>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            className="inline-flex items-center justify-center size-9 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06]"
          >
            <LogOut className="size-4" />
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** true → only admins (moderators can't see). */
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { href: "/admin/identity", label: "Identity queue", icon: ShieldCheck, adminOnly: true },
  { href: "/admin/reports", label: "Reports", icon: ClipboardList },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/revenue", label: "Platform revenue", icon: Coins, adminOnly: true },
  { href: "/admin/settings", label: "Platform settings", icon: Settings2, adminOnly: true },
  { href: "/admin/audit", label: "Audit log", icon: FileClock, adminOnly: true },
];
