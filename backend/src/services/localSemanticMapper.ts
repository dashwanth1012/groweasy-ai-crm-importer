import { DATA_SOURCES, type CrmLead, type CsvRow, type DataSource, type ParsedCrmLead, type SkippedRecord } from "../types/crm.js";
import type { BatchMappingInput, BatchMappingResult, CrmMapper } from "./crmMapper.js";

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const singleEmailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phoneRegex = /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?)?\d{5,}[\d\s-]*/g;
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

export class LocalSemanticMapper implements CrmMapper {
  readonly name = "local-semantic-dev";

  async mapRows(input: BatchMappingInput): Promise<BatchMappingResult> {
    const records: ParsedCrmLead[] = [];
    const skippedRecords: SkippedRecord[] = [];

    for (const row of input.rows) {
      const mapped = mapRow(row);

      if (!mapped.email && !mapped.mobile_without_country_code) {
        skippedRecords.push({
          sourceRowIndex: row.sourceRowIndex,
          reason: "Missing email and mobile number",
          raw: stripSourceIndex(row)
        });
        continue;
      }

      records.push({
        ...mapped,
        sourceRowIndex: row.sourceRowIndex
      });
    }

    return { records, skippedRecords };
  }
}

function mapRow(row: CsvRow & { sourceRowIndex: number }): CrmLead {
  const entries = Object.entries(stripSourceIndex(row));
  const values = entries.map(([, value]) => value).filter(Boolean);
  const emails = values.flatMap((value) => value.match(emailRegex) ?? []);
  const phones = values.flatMap((value) => value.match(phoneRegex) ?? []).map(normalizePhone).filter((value) => value.length >= 7);
  const firstPhone = phones[0] ?? "";
  const phoneParts = splitPhone(firstPhone);
  const createdAt = normalizeDate(findByHeader(entries, ["date", "created", "time", "submitted", "received"]) ?? findDate(values));
  const notes = collectNotes(entries, emails.slice(1), phones.slice(1));

  return {
    created_at: createdAt,
    name: findPersonName(entries) ?? inferName(entries),
    email: emails[0] ?? "",
    country_code: phoneParts.countryCode,
    mobile_without_country_code: phoneParts.mobile,
    company: findByHeader(entries, ["company", "organization", "business", "project", "builder"]) ?? "",
    city: findByHeader(entries, ["city", "location", "locality"]) ?? "",
    state: findByHeader(entries, ["state", "province", "region"]) ?? "",
    country: findByHeader(entries, ["country"]) ?? "",
    lead_owner: findByHeader(entries, ["owner", "agent", "assigned", "sales", "executive"]) ?? "",
    crm_status: normalizeStatus(findByHeader(entries, ["status", "stage", "disposition", "outcome"]) ?? values.join(" ")),
    crm_note: notes,
    data_source: normalizeSource(findByHeader(entries, ["source", "campaign", "project"]) ?? values.join(" ")),
    possession_time: findByHeader(entries, ["possession", "handover", "move"]) ?? "",
    description: findByHeader(entries, ["description", "requirement", "message", "interest"]) ?? ""
  };
}

function stripSourceIndex(row: CsvRow & { sourceRowIndex?: number }): Record<string, string> {
  const rest = { ...row };
  delete rest.sourceRowIndex;

  return Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, String(value ?? "")]));
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findByHeader(entries: Array<[string, string]>, terms: string[]): string | undefined {
  const scored = entries
    .map(([key, value]) => {
      const normalized = normalizeKey(key);
      const score = terms.reduce((total, term) => total + (normalized.includes(term) ? 1 : 0), 0);
      return { value: value.trim(), score };
    })
    .filter((entry) => entry.value && entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.value;
}

function findPersonName(entries: Array<[string, string]>): string | undefined {
  const scored = entries
    .map(([key, value]) => {
      const normalized = normalizeKey(key);
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

  return scored[0]?.value;
}

function inferName(entries: Array<[string, string]>): string {
  return entries
    .filter(([key]) => !isExcludedNameKey(key))
    .map(([, value]) => value)
    .find(isLikelyPersonName) ?? "";
}

function isLikelyPersonName(value: string): boolean {
  const cleaned = value.trim();
  const normalized = cleaned.toLowerCase().replace(/\s+/g, " ");

  if (cleaned.length < 2 || cleaned.length > 80 || nonNameTerms.has(normalized)) {
    return false;
  }

  if (singleEmailRegex.test(cleaned) || normalizePhone(cleaned).length >= 7 || findDate([cleaned])) {
    return false;
  }

  if (
    !/[a-z]/i.test(cleaned) ||
    /(?:city|state|country|source|status|project|campaign|location|note|remark|message|requirement|description)/i.test(cleaned) ||
    /\b(good|follow|interested|qualified|sale|sold|won|closed|bad|junk|spam|unreachable|connected|connect)\b/i.test(cleaned)
  ) {
    return false;
  }

  return /^[a-z][a-z.' -]*$/i.test(cleaned);
}

function isExcludedNameKey(key: string): boolean {
  return /\b(email|phone|mobile|cell|whatsapp|date|time|city|state|country|location|status|stage|disposition|outcome|source|campaign|project|note|remark|comment|message|requirement|description|owner|agent)\b/i.test(
    normalizeKey(key)
  );
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function splitPhone(phone: string): { countryCode: string; mobile: string } {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return { countryCode: "", mobile: "" };
  }

  if (phone.startsWith("+") && digits.length > 10) {
    return {
      countryCode: digits.slice(0, digits.length - 10),
      mobile: digits.slice(-10)
    };
  }

  if (digits.length > 10) {
    return {
      countryCode: digits.slice(0, digits.length - 10),
      mobile: digits.slice(-10)
    };
  }

  return { countryCode: "", mobile: digits };
}

function findDate(values: string[]): string | undefined {
  return values.find((value) => {
    const parsed = new Date(value);
    return value.trim().length >= 6 && !Number.isNaN(parsed.getTime());
  });
}

function normalizeDate(value: string | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeStatus(text: string): CrmLead["crm_status"] {
  const normalized = text.toLowerCase();

  if (/\b(sale|sold|won|closed|done)\b/.test(normalized)) {
    return "SALE_DONE";
  }

  if (/\b(not connected|did not connect|no answer|unreachable|dnc)\b/.test(normalized)) {
    return "DID_NOT_CONNECT";
  }

  if (/\b(bad|junk|spam|invalid|fake)\b/.test(normalized)) {
    return "BAD_LEAD";
  }

  if (/\b(good|follow|qualified|warm|interested)\b/.test(normalized)) {
    return "GOOD_LEAD_FOLLOW_UP";
  }

  return "";
}

function normalizeSource(text: string): DataSource {
  const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  return DATA_SOURCES.find((source) => normalized.includes(source)) ?? "";
}

function collectNotes(entries: Array<[string, string]>, extraEmails: string[], extraPhones: string[]): string {
  const noteTerms = ["note", "remark", "comment", "message", "feedback", "requirement", "extra"];
  const notes = entries
    .filter(([key, value]) => value && noteTerms.some((term) => normalizeKey(key).includes(term)))
    .map(([key, value]) => `${key}: ${value.replace(/\r?\n/g, "\\n")}`);

  if (extraEmails.length > 0) {
    notes.push(`Extra emails: ${extraEmails.join(", ")}`);
  }

  if (extraPhones.length > 0) {
    notes.push(`Extra mobile numbers: ${extraPhones.join(", ")}`);
  }

  return notes.join(" | ");
}
