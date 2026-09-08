import { AuthGate } from "@/components/auth/AuthGate";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return <AuthGate>{children}</AuthGate>;
}
