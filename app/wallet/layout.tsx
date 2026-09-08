import { AuthGate } from "@/components/auth/AuthGate";

export default function WalletLayout({ children }: LayoutProps<"/wallet">) {
  return <AuthGate>{children}</AuthGate>;
}
