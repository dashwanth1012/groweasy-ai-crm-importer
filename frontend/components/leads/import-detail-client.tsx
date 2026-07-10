"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DataTable } from "@/components/importer/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getImport } from "@/services/api";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/utils";

export function ImportDetailClient({ id }: { id: string }) {
  const importQuery = useQuery({
    queryKey: ["import", id],
    queryFn: () => getImport(id)
  });

  if (importQuery.isLoading) {
    return (
      <section className="min-h-screen px-4 py-6 md:px-8 xl:px-10">
        <div className="flex items-center gap-3 rounded-[8px] border border-border bg-card p-5">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="font-bold">Loading import details</p>
        </div>
      </section>
    );
  }

  if (importQuery.error || !importQuery.data) {
    return (
      <section className="min-h-screen px-4 py-6 md:px-8 xl:px-10">
        <Button href="/history" variant="secondary">
          <ArrowLeft className="h-4 w-4" />
          History
        </Button>
        <div className="mt-6 rounded-[8px] bg-[#ffe5dc] px-4 py-3 text-sm font-bold text-[#7a270f]">
          {importQuery.error instanceof Error ? importQuery.error.message : "Unable to load import details."}
        </div>
      </section>
    );
  }

  const result = importQuery.data;

  return (
    <section className="min-h-screen px-4 py-6 md:px-8 xl:px-10">
      <div className="mx-auto max-w-[1280px]">
        <Button href="/history" variant="secondary">
          <ArrowLeft className="h-4 w-4" />
          History
        </Button>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-muted-foreground">Import Details</p>
            <h1 className="mt-1 font-display text-3xl font-black md:text-5xl">{result.filename}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(result.createdAt)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Rows" value={formatNumber(result.statistics.totalRows)} />
          <Metric label="Imported" value={formatNumber(result.statistics.imported)} />
          <Metric label="Skipped" value={formatNumber(result.statistics.skipped)} />
          <Metric label="Success" value={`${result.statistics.successRate}%`} />
          <Metric label="Time" value={formatDuration(result.statistics.processingTimeMs)} />
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-black">Imported CRM Records</h2>
          <DataTable data={result.records as unknown as Record<string, unknown>[]} maxHeight={520} className="mt-4" />
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-black">Skipped Records</h2>
          <DataTable data={result.skippedRecords as unknown as Record<string, unknown>[]} maxHeight={360} className="mt-4" emptyText="No skipped records" />
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-3xl font-black">{value}</p>
    </Card>
  );
}

