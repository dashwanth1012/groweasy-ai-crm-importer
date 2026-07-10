import { AppShell } from "@/components/layout/app-shell";
import { TeamMembersClient } from "@/components/operations/operations-pages";

export default function TeamMembersPage() {
  return (
    <AppShell>
      <TeamMembersClient />
    </AppShell>
  );
}
