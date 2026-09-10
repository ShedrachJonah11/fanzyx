"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  Bookmark,
  Gift,
  Heart,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  MailCheck,
  Megaphone,
  Menu,
  MessageSquare,
  Moon,
  Radio,
  Receipt,
  Settings,
  Sun,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Toggle } from "@/components/ui/Toggle";
import { PageTransition } from "@/components/PageTransition";
import { useEmailVerify } from "@/components/auth/EmailVerifyManager";
import { useAuth } from "@/services/context";
import { useMessagingStore } from "@/services/stores/messaging";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

type NavGroup = {
  title?: string;
  items: NavItem[];
};

const buildCreatorNav = (username: string): NavGroup[] => [
  {
    items: [
      { href: "/dashboard", label: "Home", icon: Home },
      // Streamings — hidden until the feature is built.
      // { href: "/dashboard/streaming", label: "Streamings", icon: Radio },
      { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Quick Access",
    items: [
      { href: `/creator/${username}`, label: "My Profile", icon: UserRound },
      { href: "/dashboard/bookmarks", label: "Bookmarks", icon: Bookmark },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/dashboard/earnings", label: "Earnings", icon: LayoutDashboard },
      { href: "/dashboard/transactions", label: "Transactions", icon: Receipt },
      { href: "/dashboard/subscribers", label: "Subscribers", icon: Users },
      { href: "/dashboard/referrals", label: "Referrals", icon: Gift },
      // Campaigns — hidden until the feature is built.
      // { href: "/dashboard/campaigns", label: "Campaign", icon: Megaphone },
    ],
  },
];

const fanNav: NavGroup[] = [
  {
    items: [
      { href: "/feed", label: "Home", icon: Home },
      { href: "/subscriptions", label: "Subscriptions", icon: Heart },
      { href: "/messages", label: "Messages", icon: MessageSquare },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/saved", label: "Saved", icon: Bookmark },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/wallet", label: "Wallet", icon: Wallet },
      { href: "/transactions", label: "Transactions", icon: Receipt },
    ],
  },
];

const preferencesGroup = (variant: "creator" | "fan"): NavGroup => ({
  title: "Preferences",
  items: [
    {
      href: variant === "creator" ? "/dashboard/settings" : "/settings",
      label: "Settings",
      icon: Settings,
    },
    { href: "/help", label: "Help Center", icon: HelpCircle },
  ],
});

// Roots that should match exactly, not by startsWith
const EXACT_HREFS = new Set(["/dashboard", "/feed"]);

function isActive(pathname: string, href: string) {
  if (EXACT_HREFS.has(href)) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

type Props = {
  variant?: "creator" | "fan";
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardShell({
  variant = "creator",
  title,
  subtitle,
  action,
  children,
}: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const emailVerify = useEmailVerify();
  const needsEmailVerify = !!user && user.emailVerifiedAt === null && !!user.email;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      toast.success("Signed out");
    } catch {
      toast.error("Couldn't sign out");
      setLoggingOut(false);
      return;
    }
    // Hard nav — avoids the AuthGate race that would otherwise append ?next=…
    window.location.href = "/login";
  };

  const displayName = user?.displayName || user?.username || "You";
  const usernameHandle = user?.username ?? "you";
  const avatarUrl = user?.avatarUrl ?? undefined;
  const brandGradient =
    "linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)";

  const totalUnread = useMessagingStore((s) =>
    Object.values(s.conversations).reduce((n, c) => n + (c.unreadCount || 0), 0)
  );

  const rawGroups =
    variant === "creator" ? buildCreatorNav(usernameHandle) : fanNav;
  const messagesHref =
    variant === "creator" ? "/dashboard/messages" : "/messages";
  const groups = rawGroups.map((g) => ({
    ...g,
    items: g.items.map((item) =>
      item.href === messagesHref && totalUnread > 0
        ? { ...item, badge: totalUnread }
        : item
    ),
  }));
  const prefs = preferencesGroup(variant);
  const flat = groups.flatMap((g) => g.items);

  return (
    <div className="flex flex-1 min-h-screen bg-[#07070A]">
      {/* Desktop sidebar */}
      <aside className="sidebar-desktop hidden lg:flex flex-col w-64 shrink-0 border-r border-white/[0.06] px-4 py-5 sticky top-0 h-screen">
        <div className="px-2 mb-6">
          <Logo size="md" />
        </div>
        <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
          {groups.map((group, gi) => (
            <div key={gi} className={cn("flex flex-col gap-0.5", gi > 0 && "mt-5")}>
              {group.title ? <GroupHeading>{group.title}</GroupHeading> : null}
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
              ))}
            </div>
          ))}
        </nav>

        {/* Preferences */}
        <div className="mt-5 flex flex-col gap-0.5">
          <GroupHeading>{prefs.title}</GroupHeading>
          {prefs.items.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
          <NightModeSwitch />
        </div>

        {needsEmailVerify ? (
          <button
            type="button"
            onClick={emailVerify.open}
            className="mt-3 flex items-center gap-2.5 rounded-[12px] hairline bg-gradient-brand-soft px-3 py-2.5 text-left hover:bg-white/[0.06] transition-colors"
          >
            <span className="inline-flex items-center justify-center size-7 rounded-full bg-white/10 text-white shrink-0">
              <MailCheck className="size-3.5" />
            </span>
            <span className="flex flex-col min-w-0 leading-tight">
              <span className="text-[13px] font-medium text-white truncate">
                Verify your email
              </span>
              <span className="text-[11px] text-white/60 truncate">
                Tap to send a verification link
              </span>
            </span>
          </button>
        ) : null}

        {/* Profile card — pinned at the bottom */}
        <div className="mt-3 surface-card p-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={displayName}
              gradient={brandGradient}
              image={avatarUrl}
              size={40}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate">
                {displayName}
              </span>
              <span className="text-xs text-white/50 truncate">
                @{usernameHandle}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Link
                href={variant === "creator" ? "/dashboard/settings" : "/settings"}
                className="inline-flex items-center justify-center size-8 rounded-full text-white/60 hover:text-white hover:bg-white/[0.06]"
                aria-label="Settings"
              >
                <Settings className="size-4" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="Log out"
                title="Log out"
                className="inline-flex items-center justify-center size-8 rounded-full text-white/60 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-60"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar — mobile only */}
        <header className="lg:hidden sticky top-0 z-30 border-b border-white/[0.06] bg-[#07070A]/70 backdrop-blur-md">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="inline-flex items-center justify-center size-10 rounded-full text-white/80 hover:text-white hover:bg-white/[0.06]"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
              <Logo size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={variant === "creator" ? "/dashboard/notifications" : "/notifications"}
                className="inline-flex items-center justify-center size-10 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] relative"
                aria-label="Notifications"
              >
                <Bell className="size-[18px]" />
                <span className="absolute top-2 right-2 size-2 rounded-full bg-gradient-brand" />
              </Link>
              <Link
                href={variant === "creator" ? "/dashboard/settings" : "/settings"}
                className="inline-block"
              >
                <Avatar
                  name={displayName}
                  gradient={brandGradient}
                  image={avatarUrl}
                  size={36}
                />
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8 overflow-x-clip">
          <PageTransition>
            {(title || action) && (
              <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row mb-6">
                <div className="flex flex-col gap-1">
                  {title ? (
                    <h1 className="text-2xl sm:text-[28px] font-semibold text-white tracking-tight">
                      {title}
                    </h1>
                  ) : null}
                  {subtitle ? (
                    <p className="text-sm text-white/55">{subtitle}</p>
                  ) : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
              </div>
            )}
            {children}
          </PageTransition>
        </main>

        {/* Mobile bottom nav — top 5 flat items */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.06] bg-[#0A0A0F]/90 backdrop-blur-xl">
          <div className="grid grid-cols-5">
            {flat.slice(0, 5).map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium",
                    active ? "text-white" : "text-white/55"
                  )}
                >
                  <span className="relative">
                    <Icon className="size-[19px]" />
                    {item.badge ? (
                      <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-gradient-brand text-white text-[9px] font-semibold inline-flex items-center justify-center">
                        {item.badge}
                      </span>
                    ) : null}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative w-72 bg-[#0A0A0F] border-r border-white/[0.06] p-5 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <Logo size="md" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center size-9 rounded-full text-white/80 hover:text-white hover:bg-white/[0.06]"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1">
                {groups.map((group, gi) => (
                  <div key={gi} className={cn("flex flex-col gap-0.5", gi > 0 && "mt-5")}>
                    {group.title ? <GroupHeading>{group.title}</GroupHeading> : null}
                    {group.items.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        active={isActive(pathname, item.href)}
                        onClick={() => setMobileOpen(false)}
                      />
                    ))}
                  </div>
                ))}

                <div className="mt-5 flex flex-col gap-0.5">
                  <GroupHeading>{prefs.title}</GroupHeading>
                  {prefs.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={isActive(pathname, item.href)}
                      onClick={() => setMobileOpen(false)}
                    />
                  ))}
                  <NightModeSwitch />
                </div>
              </nav>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
      {children}
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm transition-colors",
        active
          ? "bg-white/[0.06] text-white"
          : "text-white/60 hover:text-white hover:bg-white/[0.04]"
      )}
    >
      <Icon
        className={cn(
          "size-[18px] shrink-0",
          active ? "text-white" : "text-white/55 group-hover:text-white/85"
        )}
      />
      <span className="font-medium flex-1">{item.label}</span>
      {item.badge ? (
        <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-gradient-brand text-white text-[10px] font-semibold inline-flex items-center justify-center">
          {item.badge}
        </span>
      ) : active ? (
        <span className="size-1.5 rounded-full bg-gradient-brand" />
      ) : null}
    </Link>
  );
}

function NightModeSwitch() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("light") ? "light" : "dark"
    );
    setMounted(true);
  }, []);

  const setThemeTo = (next: "light" | "dark") => {
    const el = document.documentElement;
    el.classList.remove("light", "dark");
    el.classList.add(next);
    el.setAttribute("data-theme", next);
    el.style.colorScheme = next;
    try {
      localStorage.setItem("fanzyx-theme", next);
    } catch {}
    setTheme(next);
  };

  const isDark = mounted && theme === "dark";
  const Icon = mounted ? (isDark ? Moon : Sun) : Moon;

  return (
    <div className="flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm text-white/70">
      <Icon className="size-[18px] shrink-0 text-white/55" />
      <span className="font-medium flex-1">Night mode</span>
      <Toggle
        size="sm"
        on={isDark}
        onChange={(next) => setThemeTo(next ? "dark" : "light")}
      />
    </div>
  );
}
