"use client";

import { DashboardShell } from "@/components/shell/DashboardShell";
import { TransactionsView } from "@/components/wallet/TransactionsView";

export default function DashboardTransactionsPage() {
  return (
    <DashboardShell
      title="Transactions"
      subtitle="Every credit and debit on your wallet."
    >
      <TransactionsView />
    </DashboardShell>
  );
}
