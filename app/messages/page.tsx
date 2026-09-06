import { DashboardShell } from "@/components/shell/DashboardShell";
import { MessagesView } from "@/components/messages/MessagesView";

export default function FanMessagesPage() {
  return (
    <DashboardShell variant="fan">
      <MessagesView />
    </DashboardShell>
  );
}
