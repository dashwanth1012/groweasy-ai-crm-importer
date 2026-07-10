export type CsvRow = Record<string, string>;

export interface CsvPreview {
  filename: string;
  headers: string[];
  rows: CsvRow[];
  preview: CsvRow[];
  statistics: {
    totalRows: number;
    totalColumns: number;
  };
}

export interface ParsedCrmLead {
  sourceRowIndex: number;
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: "" | "GOOD_LEAD_FOLLOW_UP" | "DID_NOT_CONNECT" | "BAD_LEAD" | "SALE_DONE";
  crm_note: string;
  data_source: "" | "leads_on_demand" | "meridian_tower" | "eden_park" | "varah_swamy" | "sarjapur_plots";
  possession_time: string;
  description: string;
}

export interface SkippedRecord {
  sourceRowIndex: number;
  reason: string;
  raw: CsvRow;
}

export interface BatchTimelineEntry {
  batch: number;
  totalBatches: number;
  attempts: number;
  imported: number;
  skipped: number;
  failed: number;
  durationMs: number;
  status: "completed" | "retried" | "failed";
  message: string;
}

export interface ImportStatistics {
  totalRows: number;
  totalColumns: number;
  imported: number;
  skipped: number;
  failed: number;
  successRate: number;
  processingTimeMs: number;
  batches: number;
  averageBatchTimeMs: number;
  estimatedTokens: number;
  provider: string;
  status: "completed" | "partial" | "failed";
}

export interface ImportResult {
  id: string;
  filename: string;
  createdAt: string;
  headers: string[];
  records: ParsedCrmLead[];
  skippedRecords: SkippedRecord[];
  statistics: ImportStatistics;
  timeline: BatchTimelineEntry[];
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  filename: string;
  totalRows: number;
  imported: number;
  skipped: number;
  failed: number;
  successRate: number;
  status: ImportStatistics["status"];
  processingTimeMs: number;
}
