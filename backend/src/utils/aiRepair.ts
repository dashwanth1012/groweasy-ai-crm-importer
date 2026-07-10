import { CRM_STATUSES, DATA_SOURCES, type CsvRow, type ParsedCrmLead, type SkippedRecord } from "../types/crm.js";
import { aiBatchResponseSchema } from "../validators/crmSchemas.js";

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phoneRegex = /\d{7,}/;
const nonNameTerms = new Set([
  "andhra pradesh",
  "bangalore",
  "bengaluru",
  "chennai",
  "delhi",
  "good lead",
  "hyderabad",
  "india",
  "karnataka",
  "kerala",
  "maharashtra",
  "mumbai",
  "not connected",
  "sale done",
  "tamil nadu",
  "telangana"
]);

interface RepairInput {
  rows: Array<CsvRow & { sourceRowIndex: number }>;
}

interface AiBatchResponse {
  records: ParsedCrmLead[];
  skippedRecords: SkippedRecord[];
}

export function repairAiBatchResponse(value: unknown, input: RepairInput) {
  const response = asRecord(value);
  const rawRecords = Array.isArray(response.records) ? response.records : [];
  const rawSkipped = Array.isArray(response.skippedRecords) ? response.skippedRecords : [];
  const inputByIndex = new Map(input.rows.map((row) => [row.sourceRowIndex, row]));
  const records: ParsedCrmLead[] = [];
  const skippedRecords: SkippedRecord[] = [];
  const emitted = new Set<number>();

  for (const rawRecord of rawRecords) {
    const record = asRecord(rawRecord);
    const sourceRowIndex = toSourceRowIndex(record.sourceRowIndex, inputByIndex);

    if (sourceRowIndex === null || emitted.has(sourceRowIndex)) {
      continue;
    }

    const repaired: ParsedCrmLead = {
      sourceRowIndex,
      created_at: toValidDate(record.created_at),
      name: sanitizeName(toStringValue(record.name), inputByIndex.get(sourceRowIndex)),
      email: toStringValue(record.email),
      country_code: toStringValue(record.country_code).replace(/[^\d+]/g, ""),
      mobile_without_country_code: toStringValue(record.mobile_without_country_code).replace(/\D/g, ""),
      company: toStringValue(record.company),
      city: toStringValue(record.city),
      state: toStringValue(record.state),
      country: toStringValue(record.country),
      lead_owner: toStringValue(record.lead_owner),
      crm_status: CRM_STATUSES.includes(record.crm_status as (typeof CRM_STATUSES)[number])
        ? (record.crm_status as ParsedCrmLead["crm_status"])
        : "",
      crm_note: toStringValue(record.crm_note).replace(/\r?\n/g, "\\n"),
      data_source: DATA_SOURCES.includes(record.data_source as (typeof DATA_SOURCES)[number])
        ? (record.data_source as ParsedCrmLead["data_source"])
        : "",
      possession_time: toStringValue(record.possession_time),
      description: toStringValue(record.description)
    };

    if (!hasContact(repaired)) {
      skippedRecords.push({
        sourceRowIndex,
        reason: "Missing email and mobile number",
        raw: stripSourceIndex(inputByIndex.get(sourceRowIndex))
      });
      emitted.add(sourceRowIndex);
      continue;
    }

    records.push(repaired);
    emitted.add(sourceRowIndex);
  }

  for (const rawSkippedRecord of rawSkipped) {
    const skipped = asRecord(rawSkippedRecord);
    const sourceRowIndex = toSourceRowIndex(skipped.sourceRowIndex, inputByIndex);

    if (sourceRowIndex === null || emitted.has(sourceRowIndex)) {
      continue;
    }

    skippedRecords.push({
      sourceRowIndex,
      reason: toStringValue(skipped.reason) || "Skipped by AI",
      raw: stripSourceIndex(inputByIndex.get(sourceRowIndex))
    });
    emitted.add(sourceRowIndex);
  }

  return ensureAiBatchCoverage({ records, skippedRecords }, input);
}

export function ensureAiBatchCoverage(value: AiBatchResponse, input: RepairInput) {
  const inputByIndex = new Map(input.rows.map((row) => [row.sourceRowIndex, row]));
  const records: ParsedCrmLead[] = [];
  const skippedRecords: SkippedRecord[] = [];
  const emitted = new Set<number>();

  for (const record of value.records) {
    if (!inputByIndex.has(record.sourceRowIndex) || emitted.has(record.sourceRowIndex)) {
      continue;
    }

    const normalizedRecord = {
      ...record,
      name: sanitizeName(record.name, inputByIndex.get(record.sourceRowIndex))
    };

    if (!hasContact(normalizedRecord)) {
      skippedRecords.push({
        sourceRowIndex: record.sourceRowIndex,
        reason: "Missing email and mobile number",
        raw: stripSourceIndex(inputByIndex.get(record.sourceRowIndex))
      });
      emitted.add(record.sourceRowIndex);
      continue;
    }

    records.push(normalizedRecord);
    emitted.add(record.sourceRowIndex);
  }

  for (const skippedRecord of value.skippedRecords) {
    if (!inputByIndex.has(skippedRecord.sourceRowIndex) || emitted.has(skippedRecord.sourceRowIndex)) {
      continue;
    }

    skippedRecords.push({
      sourceRowIndex: skippedRecord.sourceRowIndex,
      reason: skippedRecord.reason,
      raw: stripSourceIndex(inputByIndex.get(skippedRecord.sourceRowIndex))
    });
    emitted.add(skippedRecord.sourceRowIndex);
  }

  for (const row of input.rows) {
    if (!emitted.has(row.sourceRowIndex)) {
      skippedRecords.push({
        sourceRowIndex: row.sourceRowIndex,
        reason: "No CRM mapping returned",
        raw: stripSourceIndex(row)
      });
    }
  }

  return aiBatchResponseSchema.parse({ records, skippedRecords });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toStringValue(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function toValidDate(value: unknown): string {
  const raw = toStringValue(value);
  const parsed = new Date(raw);

  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function toSourceRowIndex(value: unknown, inputByIndex: Map<number, CsvRow & { sourceRowIndex: number }>): number | null {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || !inputByIndex.has(parsed)) {
    return null;
  }

  return parsed;
}

function hasContact(record: ParsedCrmLead): boolean {
  return emailRegex.test(record.email) || phoneRegex.test(record.mobile_without_country_code);
}

function sanitizeName(value: string, row: (CsvRow & { sourceRowIndex: number }) | undefined): string {
  if (isLikelyPersonName(value)) {
    return value.trim();
  }

  return findInputPersonName(row) ?? "";
}

function findInputPersonName(row: (CsvRow & { sourceRowIndex: number }) | undefined): string | undefined {
  if (!row) {
    return undefined;
  }

  const entries = Object.entries(stripSourceIndex(row)).map(([key, value]) => [key, String(value ?? "")] as const);
  const scored = entries
    .map(([key, value]) => {
      const normalized = key.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const score =
        (normalized.includes("name") ? 4 : 0) +
        (normalized.includes("customer") ? 3 : 0) +
        (normalized.includes("client") ? 3 : 0) +
        (normalized.includes("person") ? 3 : 0) +
        (normalized.includes("contact") ? 2 : 0) +
        (normalized === "lead" || normalized === "lead name" ? 1 : 0);
      return { value: value.trim(), score };
    })
    .filter((entry) => entry.score > 0 && isLikelyPersonName(entry.value))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.value ?? entries.filter(([key]) => !isExcludedNameKey(key)).map(([, value]) => value).find(isLikelyPersonName);
}

function isLikelyPersonName(value: string): boolean {
  const cleaned = value.trim();
  const normalized = cleaned.toLowerCase().replace(/\s+/g, " ");

  if (cleaned.length < 2 || cleaned.length > 80 || nonNameTerms.has(normalized)) {
    return false;
  }

  if (emailRegex.test(cleaned) || phoneRegex.test(cleaned) || !/[a-z]/i.test(cleaned)) {
    return false;
  }

  if (
    !Number.isNaN(new Date(cleaned).getTime()) ||
    /(?:city|state|country|source|status|project|campaign|location|note|remark|message|requirement|description)/i.test(cleaned) ||
    /\b(good|follow|interested|qualified|sale|sold|won|closed|bad|junk|spam|unreachable|connected|connect)\b/i.test(cleaned)
  ) {
    return false;
  }

  return /^[a-z][a-z.' -]*$/i.test(cleaned);
}

function isExcludedNameKey(key: string): boolean {
  return /\b(email|phone|mobile|cell|whatsapp|date|time|city|state|country|location|status|stage|disposition|outcome|source|campaign|project|note|remark|comment|message|requirement|description|owner|agent)\b/i.test(
    key.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
  );
}

function stripSourceIndex(row: (CsvRow & { sourceRowIndex: number }) | undefined): CsvRow {
  if (!row) {
    return {};
  }

  const { sourceRowIndex: _sourceRowIndex, ...raw } = row;
  void _sourceRowIndex;
  return raw;
}
