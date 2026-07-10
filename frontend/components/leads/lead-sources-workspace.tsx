"use client";

import { motion } from "framer-motion";
import { CheckCircle2, CloudUpload, FileSpreadsheet, Link2, Loader2, Plus, RefreshCw, Search, Upload, WifiOff, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImportModal } from "@/components/importer/import-modal";
import { ResultsDashboard } from "@/components/importer/results-dashboard";
import { DataTable } from "@/components/importer/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useLocalStorageState } from "@/hooks/use-local-storage";
import { importRows } from "@/services/api";
import type { CsvPreview, ImportResult } from "@/types/import";

const sourceCards = [
  {
    id: "google-ads",
    name: "Google Ads",
    label: "Ad lead form sync",
    icon: "G",
    requirements: ["Google Ads account", "Lead form access", "Campaign permissions"]
  },
  {
    id: "facebook-ads",
    name: "Facebook Ads",
    label: "Instant form exports",
    icon: "f",
    requirements: ["Meta business account", "Page lead access", "Ads permissions"]
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    label: "Manual contact CSV",
    icon: "W",
    requirements: ["Business phone number", "Webhook endpoint", "Account verification"]
  },
  {
    id: "telephony",
    name: "Telephony",
    label: "Call center exports",
    icon: "T",
    requirements: ["Calling provider", "Agent number mapping", "Call log permissions"]
  }
];

export function LeadSourcesWorkspace() {
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sourceConnections, setSourceConnections] = useLocalStorageState<Record<string, boolean>>("groweasy-lead-source-connections", {});
  const [selectedSource, setSelectedSource] = useState<(typeof sourceCards)[number] | null>(null);
  const [connectingSource, setConnectingSource] = useState("");
  const [sourceMessage, setSourceMessage] = useState("");
  const connectionTimerRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const openModal = useCallback(() => {
    setError("");
    setModalOpen(true);
  }, []);

  useKeyboardShortcut("u", openModal);

  useEffect(() => {
    return () => {
      if (connectionTimerRef.current) {
        window.clearTimeout(connectionTimerRef.current);
      }
    };
  }, []);

  const displayedRows = useMemo(() => {
    if (result?.records.length) {
      return result.records.map((record) => ({
        "Lead Name": record.name,
        Email: record.email,
        Contact: [formatCountryCode(record.country_code), record.mobile_without_country_code].filter(Boolean).join(" "),
        "Date Created": new Date(record.created_at).toLocaleString("en-IN"),
        Company: record.company || "-",
        Status: labelStatus(record.crm_status),
        Quality: record.crm_status === "GOOD_LEAD_FOLLOW_UP" ? "A" : "-",
        Action: "More"
      }));
    }

    return [];
  }, [result]);

  const filteredRows = useMemo(() => {
    if (!query) {
      return displayedRows;
    }

    const normalized = query.toLowerCase();
    return displayedRows.filter((row) => Object.values(row).some((value) => String(value).toLowerCase().includes(normalized)));
  }, [displayedRows, query]);

  async function confirmImport() {
    if (!preview) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const imported = await importRows({
        filename: preview.filename,
        headers: preview.headers,
        rows: preview.rows
      });
      setResult(imported);
      setModalOpen(false);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    if (loading) {
      return;
    }

    setModalOpen(false);
    setPreview(null);
  }

  function connectSource(source: (typeof sourceCards)[number]) {
    setSelectedSource(source);
    setSourceMessage("");
  }

  function confirmSourceConnection() {
    if (!selectedSource) {
      return;
    }

    setConnectingSource(selectedSource.id);

    if (connectionTimerRef.current) {
      window.clearTimeout(connectionTimerRef.current);
    }

    connectionTimerRef.current = window.setTimeout(() => {
      setSourceConnections((current) => ({ ...current, [selectedSource.id]: true }));
      setConnectingSource("");
      setSourceMessage(`${selectedSource.name} connected successfully.`);
    }, 550);
  }

  function disconnectSource(source: (typeof sourceCards)[number]) {
    setSourceConnections((current) => ({ ...current, [source.id]: false }));
    setSourceMessage(`${source.name} disconnected.`);
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 xl:px-10">
      <div className="mx-auto max-w-[1320px]">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-muted-foreground">Control Center</p>
            <h1 className="mt-1 font-display text-3xl font-black md:text-5xl">Lead Sources</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Connect, manage, and control all lead channels from one dashboard.</p>
          </div>
          <Button onClick={openModal}>
            <CloudUpload className="h-4 w-4" />
            Import CSV
          </Button>
        </section>

        <section className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <button
            className="focus-ring group flex min-h-[122px] items-center gap-5 rounded-[8px] border border-dashed border-border bg-card px-6 text-left editorial-transition hover:bg-muted"
            onClick={openModal}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-accent text-accent-foreground editorial-transition">
              <Upload className="h-7 w-7" />
            </span>
            <span>
              <span className="block text-lg font-black">Import Leads via CSV</span>
              <span className="mt-1 block text-sm text-muted-foreground">Upload a spreadsheet and let AI map CRM lead fields.</span>
            </span>
            <Plus className="ml-auto h-5 w-5 text-muted-foreground" />
          </button>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-muted-foreground">Import Intelligence</p>
                <h2 className="mt-1 text-xl font-black">Semantic Mapping</h2>
              </div>
              <Badge tone="success">Ready</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Large files are processed in safe batches with retries, validation, and clear skipped-record reasons.
            </p>
          </Card>
        </section>

        {error && (
          <div className="mt-5 flex items-center gap-3 rounded-[8px] bg-[#ffe5dc] px-4 py-3 text-sm font-bold text-[#7a270f]">
            <WifiOff className="h-4 w-4" />
            {error}
          </div>
        )}

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-muted-foreground">Active Lead Sources</p>
              <h2 className="mt-1 text-2xl font-black">Connected Channels</h2>
            </div>
            <Button variant="ghost" size="icon" aria-label="Refresh sources" onClick={() => setSourceMessage("Lead source statuses refreshed.")}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {sourceMessage && (
            <div className="mt-4 rounded-[8px] bg-accent px-4 py-3 text-sm font-bold text-accent-foreground">
              {sourceMessage}
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {sourceCards.map((source, index) => (
              <motion.article
                key={source.name}
                className="rounded-[8px] border border-border bg-card p-5"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2, ease: [0.77, 0, 0.175, 1] }}
              >
                {(() => {
                  const connected = Boolean(sourceConnections[source.id]);

                  return (
                    <>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-muted font-black">{source.icon}</span>
                    <div>
                      <h3 className="font-black">{source.name}</h3>
                      <p className="text-xs text-muted-foreground">{source.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black">{connected ? "Connected" : "Not Connected"}</p>
                    <p className="text-xs text-muted-foreground">- {connected ? "Active" : "Inactive"}</p>
                  </div>
                </div>
                <Button
                  variant={connected ? "danger" : "secondary"}
                  className="mt-5 w-full"
                  onClick={() => (connected ? disconnectSource(source) : connectSource(source))}
                >
                  {connected ? <X className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                  {connected ? "Disconnect" : "Connect"}
                </Button>
                    </>
                  );
                })()}
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase text-muted-foreground">{result ? "Imported Leads" : "Your Leads"}</p>
              <h2 className="mt-1 text-2xl font-black">Manage Your Leads</h2>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-[360px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Enter email or phone number..."
                  className="pl-9"
                />
              </div>
              <Button variant="secondary" size="icon" aria-label="Search leads" onClick={() => searchInputRef.current?.focus()}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {result || filteredRows.length > 0 ? (
            <DataTable data={filteredRows} headers={["Lead Name", "Email", "Contact", "Date Created", "Company", "Status", "Quality", "Action"]} maxHeight={390} className="mt-4" />
          ) : (
            <Card className="mt-4 flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
              <h3 className="mt-5 text-2xl font-black">No imported leads yet</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Import a CSV to review mapped lead records, statuses, notes, and skipped-row reasons in this workspace.
              </p>
              <Button onClick={openModal} className="mt-6">
                <Upload className="h-4 w-4" />
                Import CSV
              </Button>
            </Card>
          )}
        </section>

        {loading && (
          <div className="mt-8 flex items-center gap-3 rounded-[8px] border border-border bg-card p-5">
            <Loader2 className="h-5 w-5 animate-spin" />
            <div>
              <p className="font-black">AI processing in progress</p>
              <p className="text-sm text-muted-foreground">Batches are being validated and mapped into GrowEasy CRM fields.</p>
            </div>
          </div>
        )}

        {result && <ResultsDashboard result={result} onRetry={openModal} />}
      </div>

      <ImportModal
        open={modalOpen}
        preview={preview}
        loading={loading}
        onClose={closeModal}
        onPreview={setPreview}
        onConfirm={confirmImport}
      />

      {selectedSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8" role="dialog" aria-modal="true" aria-label={`${selectedSource.name} Integration`}>
          <Card className="w-full max-w-lg p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-muted-foreground">Lead Source Integration</p>
                <h2 className="mt-1 text-2xl font-black">{selectedSource.name} Integration</h2>
              </div>
              <Button variant="ghost" size="icon" aria-label="Close integration modal" onClick={() => setSelectedSource(null)} disabled={Boolean(connectingSource)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Synchronize lead data into GrowEasy once this channel is connected. Connection state is saved for this workspace.
            </p>
            <div className="mt-5 rounded-[8px] border border-border p-4">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Current Status</p>
              <div className="mt-2 flex items-center gap-2 font-black">
                {sourceConnections[selectedSource.id] ? <CheckCircle2 className="h-4 w-4 text-accent-foreground" /> : <Link2 className="h-4 w-4 text-muted-foreground" />}
                {sourceConnections[selectedSource.id] ? "Connected" : "Not Connected"}
              </div>
            </div>
            <div className="mt-5">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Requirements</p>
              <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                {selectedSource.requirements.map((requirement) => (
                  <li key={requirement} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>
            {sourceMessage && <div className="mt-5 rounded-[8px] bg-accent px-4 py-3 text-sm font-bold text-accent-foreground">{sourceMessage}</div>}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setSelectedSource(null)} disabled={Boolean(connectingSource)}>
                Cancel
              </Button>
              <Button onClick={confirmSourceConnection} disabled={Boolean(connectingSource) || Boolean(sourceConnections[selectedSource.id])}>
                {connectingSource ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {connectingSource ? "Connecting..." : sourceConnections[selectedSource.id] ? "Connected" : "Connect"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function labelStatus(status: string): string {
  const labels: Record<string, string> = {
    GOOD_LEAD_FOLLOW_UP: "Good Lead",
    DID_NOT_CONNECT: "Not Dialed",
    BAD_LEAD: "Bad Lead",
    SALE_DONE: "Sale Done"
  };

  return labels[status] ?? "Not Dialed";
}

function formatCountryCode(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}
