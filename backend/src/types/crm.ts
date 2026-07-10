export const CRM_STATUSES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE"
] as const;

export const DATA_SOURCES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots"
] as const;

export type CrmStatus = (typeof CRM_STATUSES)[number] | "";
export type DataSource = (typeof DATA_SOURCES)[number] | "";

export type CsvRow = Record<string, string | number>;

export interface CrmLead {
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
  crm_status: CrmStatus;
  crm_note: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

export interface ParsedCrmLead extends CrmLead {
  sourceRowIndex: number;
}

export interface SkippedRecord {
  sourceRowIndex: number;
  reason: string;
  raw: CsvRow;
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

export interface StoredImport extends ImportResult {
  history: HistoryEntry;
}
