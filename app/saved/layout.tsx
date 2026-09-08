import { AuthGate } from "@/components/auth/AuthGate";

export default function SavedLayout({ children }: LayoutProps<"/saved">) {
  return <AuthGate>{children}</AuthGate>;
}
