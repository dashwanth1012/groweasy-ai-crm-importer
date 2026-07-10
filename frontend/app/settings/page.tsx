import { AppShell } from "@/components/layout/app-shell";
import { SettingsClient } from "@/components/operations/operations-pages";

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsClient />
    </AppShell>
  );
}
