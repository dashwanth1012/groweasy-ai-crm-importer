import { AppShell } from "@/components/layout/app-shell";
import { AdAccountsClient } from "@/components/operations/operations-pages";

export default function AdAccountsPage() {
  return (
    <AppShell>
      <AdAccountsClient />
    </AppShell>
  );
}
