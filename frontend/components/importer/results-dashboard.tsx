"use client";

import { CheckCircle2, Clock3, Download, FileJson, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/importer/data-table";
import { downloadTextFile, toCsv } from "@/lib/csv";
import { formatDuration, formatNumber } from "@/lib/utils";
import type { ImportResult } from "@/types/import";

export function ResultsDashboard({ result, onRetry }: { result: ImportResult; onRetry: () => void }) {
  const stats = result.statistics;
  const resultHeaders = [
    "created_at",
    "name",
    "email",
    "country_code",
    "mobile_without_country_code",
    "company",
    "city",
    "state",
    "country",
    "crm_status",
    "data_source",
    "crm_note"
  ];

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-muted-foreground">AI import results</p>
          <h2 className="mt-1 font-display text-3xl font-black md:text-5xl">Clean CRM Records</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => downloadTextFile(`${result.filename.replace(/\.csv$/i, "")}-clean.json`, JSON.stringify(result.records, null, 2), "application/json")}
          >
            <FileJson className="h-4 w-4" />
            Export JSON
          </Button>
          <Button
            variant="secondary"
            onClick={() => downloadTextFile(`${result.filename.replace(/\.csv$/i, "")}-clean.csv`, toCsv(result.records), "text/csv")}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigator.clipboard?.writeText(JSON.stringify(result.records, null, 2))}
          >
            <FileJson className="h-4 w-4" />
            Copy JSON
          </Button>
          <Button variant="ghost" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Rows" value={formatNumber(stats.totalRows)} icon={<FileJson className="h-4 w-4" />} />
        <StatCard label="Imported" value={formatNumber(stats.imported)} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Skipped" value={formatNumber(stats.skipped)} icon={<TriangleAlert className="h-4 w-4" />} />
        <StatCard label="Success" value={`${stats.successRate}%`} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Processing" value={formatDuration(stats.processingTimeMs)} icon={<Clock3 className="h-4 w-4" />} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <StatCard label="Batches" value={formatNumber(stats.batches)} icon={<FileJson className="h-4 w-4" />} />
        <StatCard label="Avg Batch Time" value={formatDuration(stats.averageBatchTimeMs)} icon={<Clock3 className="h-4 w-4" />} />
        <StatCard label="AI Tokens Est." value={formatNumber(stats.estimatedTokens)} icon={<FileJson className="h-4 w-4" />} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DataTable data={result.records as unknown as Record<string, unknown>[]} headers={resultHeaders} maxHeight={520} />
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black">Batch Timeline</h3>
            <Badge tone={stats.status === "completed" ? "success" : stats.status === "partial" ? "warning" : "muted"}>
              {stats.status}
            </Badge>
          </div>
          <div className="mt-4 space-y-3">
            {result.timeline.map((entry) => (
              <div key={entry.batch} className="rounded-[8px] border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black">
                    Batch {entry.batch}/{entry.totalBatches}
                  </p>
                  <Badge tone={entry.status === "failed" ? "warning" : "success"}>{entry.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{entry.message}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <Mini label="Imported" value={entry.imported} />
                  <Mini label="Skipped" value={entry.skipped} />
                  <Mini label="Attempts" value={entry.attempts} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {result.skippedRecords.length > 0 && (
        <div className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-muted-foreground">Skipped Rows</p>
              <h3 className="mt-1 text-2xl font-black">Review Skipped Reasons</h3>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                downloadTextFile(`${result.filename.replace(/\.csv$/i, "")}-skipped.json`, JSON.stringify(result.skippedRecords, null, 2), "application/json")
              }
            >
              <Download className="h-4 w-4" />
              Export Skipped
            </Button>
          </div>
          <DataTable data={result.skippedRecords as unknown as Record<string, unknown>[]} maxHeight={360} className="mt-4" />
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <p className="text-[10px] font-black uppercase">{label}</p>
        {icon}
      </div>
      <p className="mt-5 font-display text-3xl font-black">{value}</p>
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
      <p className="font-black">{formatNumber(value)}</p>
    </div>
  );
}
