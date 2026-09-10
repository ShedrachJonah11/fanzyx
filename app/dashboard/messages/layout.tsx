import { AuthGate } from "@/components/auth/AuthGate";
import { MessagesShell } from "@/components/messaging/MessagesShell";

export default function DashboardMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <MessagesShell basePath="/dashboard/messages" variant="creator">
        {children}
      </MessagesShell>
    </AuthGate>
  );
}
