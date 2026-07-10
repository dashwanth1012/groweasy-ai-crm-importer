import { AppShell } from "@/components/layout/app-shell";
import { ImportDetailClient } from "@/components/leads/import-detail-client";

export default async function ImportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell>
      <ImportDetailClient id={id} />
    </AppShell>
  );
}

