import { AppShell } from "@/components/layout/app-shell";
import { ApiCenterClient } from "@/components/operations/operations-pages";

export default function ApiCenterPage() {
  return (
    <AppShell>
      <ApiCenterClient />
    </AppShell>
  );
}
