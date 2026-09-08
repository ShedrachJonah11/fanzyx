import { AuthGate } from "@/components/auth/AuthGate";

export default function SubscriptionsLayout({ children }: LayoutProps<"/subscriptions">) {
  return <AuthGate>{children}</AuthGate>;
}
