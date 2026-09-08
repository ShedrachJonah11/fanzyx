import { AuthGate } from "@/components/auth/AuthGate";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <AuthGate requireRole="creator">{children}</AuthGate>;
}
