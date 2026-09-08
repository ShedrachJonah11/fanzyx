"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/services/context";

export interface AuthGateProps {
  children: ReactNode;
  requireRole?: "creator" | "admin";
}

export function AuthGate({ children, requireRole }: AuthGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (requireRole && user.role !== requireRole && user.role !== "admin") {
      router.replace("/feed");
    }
  }, [loading, user, requireRole, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <span className="size-6 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
      </div>
    );
  }

  if (requireRole && user.role !== requireRole && user.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
