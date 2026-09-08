import { AuthGate } from "@/components/auth/AuthGate";

export default function TransactionsLayout({ children }: LayoutProps<"/transactions">) {
  return <AuthGate>{children}</AuthGate>;
}
