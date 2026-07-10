"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Download, FileSpreadsheet, Loader2, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteImport, getHistory, getImport, importRows } from "@/services/api";
import { downloadTextFile } from "@/lib/csv";
import { formatDateTime, formatDuration, formatNumber } from "@/lib/utils";
import type { CsvRow } from "@/types/import";

export function HistoryClient() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const queryClient = useQueryClient();
  const historyQuery = useQuery({
    queryKey: ["history"],
    queryFn: getHistory
  });
  const deleteMutation = useMutation({
    mutationFn: deleteImport,
    onSuccess: async () => {
      setExpanded(null);
      await queryClient.invalidateQueries({ queryKey: ["history"] });
    }
  });
  const reimportMutation = useMutation({
    mutationFn: async (id: string) => {
      const detail = await getImport(id);
      const rows = detail.records.map(({ sourceRowIndex: _sourceRowIndex, ...record }) => {
        void _sourceRowIndex;
        return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, String(value ?? "")])) as CsvRow;
      });

      if (rows.length === 0) {
        throw new Error("This import has no records to re-import.");
      }

      return importRows({
        filename: `reimport-${detail.filename}`,
        headers: Object.keys(rows[0]),
        rows
      });
    },
    onSuccess: async () => {
      setActionMessage("Import queued again and saved to history.");
      await queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: (error) => {
      setActionMessage(error instanceof Error ? error.message : "Unable to re-import this file.");
    }
  });

  function deleteHistoryEntry(id: string, filename: string) {
    if (window.confirm(`Delete import history for ${filename}?`)) {
      deleteMutation.mutate(id);
    }
  }

  async function downloadHistoryEntry(id: string, filename: string) {
    const detail = await getImport(id);
    downloadTextFile(`${filename.replace(/\.csv$/i, "")}-history.json`, JSON.stringify(detail, null, 2), "application/json");
    setActionMessage("History file downloaded.");
  }

  return (
    <section className="min-h-screen px-4 py-6 md:px-8 xl:px-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-muted-foreground">Import History</p>
            <h1 className="mt-1 font-display text-3xl font-black md:text-5xl">Manage Your Leads</h1>
            <p className="mt-2 text-sm text-muted-foreground">Review past imports, success rates, skipped rows, and processing time.</p>
          </div>
          <Button variant="secondary" onClick={() => historyQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {historyQuery.isLoading && (
          <div className="mt-10 flex items-center gap-3 rounded-[8px] border border-border bg-card p-5">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="font-bold">Loading import history</p>
          </div>
        )}

        {historyQuery.error && (
          <div className="mt-10 rounded-[8px] bg-[#ffe5dc] px-4 py-3 text-sm font-bold text-[#7a270f]">
            {historyQuery.error instanceof Error ? historyQuery.error.message : "Unable to load history."}
          </div>
        )}

        {actionMessage && <div className="mt-5 rounded-[8px] bg-accent px-4 py-3 text-sm font-bold text-accent-foreground">{actionMessage}</div>}

        {historyQuery.data?.length === 0 && (
          <Card className="mt-10 flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
            <h2 className="mt-5 text-2xl font-black">No imports yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">Run your first CSV import from Lead Sources and it will appear here.</p>
            <Button href="/import" className="mt-6">
              Import CSV
            </Button>
          </Card>
        )}

        <div className="mt-8 space-y-3">
          {historyQuery.data?.map((entry) => (
            <article key={entry.id} className="rounded-[8px] border border-border bg-card">
              <button
                className="focus-ring grid w-full gap-4 p-4 text-left md:grid-cols-[1fr_120px_120px_120px_120px]"
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
              >
                <div>
                  <p className="font-black">{entry.filename}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDateTime(entry.timestamp)}
                  </p>
                </div>
                <HistoryMetric label="Rows" value={formatNumber(entry.totalRows)} />
                <HistoryMetric label="Imported" value={formatNumber(entry.imported)} />
                <HistoryMetric label="Skipped" value={formatNumber(entry.skipped)} />
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Status</p>
                  <Badge tone={entry.status === "completed" ? "success" : entry.status === "partial" ? "warning" : "muted"} className="mt-2">
                    {entry.status}
                  </Badge>
                </div>
              </button>

              {expanded === entry.id && (
                <div className="grid gap-4 border-t border-border p-4 text-sm xl:grid-cols-[1fr_1fr_auto_auto_auto_auto]">
                  <HistoryMetric label="Success Rate" value={`${entry.successRate}%`} />
                  <HistoryMetric label="Processing Time" value={formatDuration(entry.processingTimeMs)} />
                  <Button href={`/history/${entry.id}`} variant="secondary" className="md:justify-self-end">
                    Open Details
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void downloadHistoryEntry(entry.id, entry.filename)}
                    className="md:justify-self-end"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => reimportMutation.mutate(entry.id)}
                    disabled={reimportMutation.isPending}
                    className="md:justify-self-end"
                  >
                    {reimportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                    Re-import
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => deleteHistoryEntry(entry.id, entry.filename)}
                    disabled={deleteMutation.isPending}
                    className="md:justify-self-end"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}
