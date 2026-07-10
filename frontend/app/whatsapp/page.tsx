import { AppShell } from "@/components/layout/app-shell";
import { WhatsAppClient } from "@/components/operations/operations-pages";

export default function WhatsAppPage() {
  return (
    <AppShell>
      <WhatsAppClient />
    </AppShell>
  );
}
