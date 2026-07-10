import type { CsvRow, ParsedCrmLead, SkippedRecord } from "../types/crm.js";

export interface BatchMappingInput {
  headers: string[];
  rows: Array<CsvRow & { sourceRowIndex: number }>;
}

export interface BatchMappingResult {
  records: ParsedCrmLead[];
  skippedRecords: SkippedRecord[];
}

export interface CrmMapper {
  readonly name: string;
  mapRows(input: BatchMappingInput): Promise<BatchMappingResult>;
}

