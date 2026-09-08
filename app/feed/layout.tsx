import { AuthGate } from "@/components/auth/AuthGate";

export default function FeedLayout({ children }: LayoutProps<"/feed">) {
  return <AuthGate>{children}</AuthGate>;
}
