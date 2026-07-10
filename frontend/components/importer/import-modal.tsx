"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/importer/data-table";
import { downloadTextFile, parseCsvFile, templateCsv } from "@/lib/csv";
import { formatNumber } from "@/lib/utils";
import type { CsvPreview } from "@/types/import";

interface ImportModalProps {
  open: boolean;
  preview: CsvPreview | null;
  loading: boolean;
  onClose: () => void;
  onPreview: (preview: CsvPreview) => void;
  onConfirm: () => void;
}

const MAX_CSV_FILE_SIZE = 8 * 1024 * 1024;

export function ImportModal({ open, preview, loading, onClose, onPreview, onConfirm }: ImportModalProps) {
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const titleId = useId();
  const descriptionId = useId();

  const handleFile = useCallback(
    async (file: File) => {
      setError("");
      setProgress(22);

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setProgress(0);
        setError("Only CSV files are supported.");
        return;
      }

      if (file.size > MAX_CSV_FILE_SIZE) {
        setProgress(0);
        setError("CSV files must be 8 MB or smaller.");
        return;
      }

      try {
        const parsed = await parseCsvFile(file);
        setProgress(100);
        onPreview(parsed);
      } catch (parseError) {
        setProgress(0);
        setError(parseError instanceof Error ? parseError.message : "Unable to parse CSV.");
      }
    },
    [onPreview]
  );

  const { getRootProps, getInputProps, isDragActive, open: openPicker } = useDropzone({
    accept: { "text/csv": [".csv"] },
    maxSize: MAX_CSV_FILE_SIZE,
    multiple: false,
    noClick: true,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (file) {
        void handleFile(file);
      }
    },
    onDropRejected: () => {
      setProgress(0);
      setError("Upload a CSV file up to 8 MB.");
    }
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <motion.section
            className="w-full max-w-[680px] rounded-[8px] bg-card p-5 shadow-soft"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.77, 0, 0.175, 1] }}
          >
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-lg font-black">Import Leads via CSV</h2>
                <p id={descriptionId} className="mt-1 text-xs text-muted-foreground">Upload a CSV file to bulk import leads into your system.</p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Close import modal" onClick={onClose} disabled={loading}>
                <X className="h-4 w-4" />
              </Button>
            </header>

            <div className="mt-5">
              {!preview ? (
                <div
                  {...getRootProps()}
                  className={`focus-ring flex min-h-[282px] flex-col items-center justify-center rounded-[8px] border border-dashed p-8 text-center editorial-transition ${
                    isDragActive ? "border-foreground bg-muted" : "border-border"
                  }`}
                  tabIndex={0}
                >
                  <input {...getInputProps()} />
                  <span className="flex h-14 w-14 items-center justify-center rounded-[8px] border border-border bg-background text-accent-foreground">
                    <Upload className="h-7 w-7" />
                  </span>
                  <h3 className="mt-7 text-lg font-black">Drop your CSV file here</h3>
                  <p className="mt-1 text-xs text-muted-foreground">or choose a file from your device</p>
                  <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={openPicker}>
                    <FileSpreadsheet className="h-4 w-4" />
                    Browse CSV
                  </Button>
                  <p className="mt-3 text-[11px] font-bold text-muted-foreground">Supported file: .csv up to 8 MB</p>
                  <p className="mt-5 max-w-md text-[11px] leading-relaxed text-muted-foreground">
                    Required headers can be anything. The AI extracts created_at, name, email, phone, company,
                    city, status, source, notes, and related CRM fields from the data.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-5 bg-accent text-accent-foreground"
                    onClick={() => downloadTextFile("groweasy-csv-template.csv", templateCsv(), "text/csv")}
                  >
                    <Download className="h-4 w-4" />
                    Download CSV Template
                  </Button>
                </div>
              ) : (
                <div className="rounded-[8px] border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-accent text-accent-foreground">
                        <FileSpreadsheet className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="font-black">{preview.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(preview.statistics.totalRows)} rows - {formatNumber(preview.statistics.totalColumns)} columns
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Remove file" onClick={onClose} disabled={loading}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <Metric label="Rows" value={formatNumber(preview.statistics.totalRows)} />
                    <Metric label="Columns" value={formatNumber(preview.statistics.totalColumns)} />
                    <Metric label="Detected headers" value={formatNumber(preview.headers.length)} />
                  </div>

                  <DataTable data={preview.preview} headers={preview.headers} maxHeight={240} className="mt-4" />
                </div>
              )}

              {progress > 0 && progress < 100 && <Progress value={progress} className="mt-4" />}
              {error && <p className="mt-4 rounded-[8px] bg-[#ffe5dc] px-4 py-3 text-sm font-bold text-[#7a270f]">{error}</p>}
            </div>

            <footer className="mt-5 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={onConfirm} disabled={!preview || loading} className="bg-[#ff6b45] text-white hover:bg-[#ef5d38]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload File
              </Button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-border bg-card px-3 py-2">
      <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}
