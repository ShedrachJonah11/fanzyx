import { DashboardShell } from "@/components/shell/DashboardShell";
import { MessagesView } from "@/components/messages/MessagesView";

export default function CreatorMessagesPage() {
  return (
    <DashboardShell variant="creator">
      <MessagesView />
    </DashboardShell>
  );
}
