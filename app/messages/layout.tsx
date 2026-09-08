import { AuthGate } from "@/components/auth/AuthGate";

export default function MessagesLayout({ children }: LayoutProps<"/messages">) {
  return <AuthGate>{children}</AuthGate>;
}
