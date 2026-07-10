import { z } from "zod";
import { CRM_STATUSES, DATA_SOURCES } from "../types/crm.js";

const crmStatusSchema = z.union([z.enum(CRM_STATUSES), z.literal("")]);
const dataSourceSchema = z.union([z.enum(DATA_SOURCES), z.literal("")]);

export const csvRowSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.undefined()]).transform((value) =>
    value === null || value === undefined ? "" : String(value)
  )
);

export const crmLeadSchema = z.object({
  created_at: z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), "created_at must be a valid date"),
  name: z.string(),
  email: z.string(),
  country_code: z.string(),
  mobile_without_country_code: z.string(),
  company: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  lead_owner: z.string(),
  crm_status: crmStatusSchema,
  crm_note: z.string(),
  data_source: dataSourceSchema,
  possession_time: z.string(),
  description: z.string()
});

export const parsedCrmLeadSchema = crmLeadSchema.extend({
  sourceRowIndex: z.number().int().nonnegative()
});

export const skippedRecordSchema = z.object({
  sourceRowIndex: z.number().int().nonnegative(),
  reason: z.string().min(1),
  raw: z.record(z.union([z.string(), z.number()]))
});

export const aiBatchResponseSchema = z.object({
  records: z.array(parsedCrmLeadSchema),
  skippedRecords: z.array(skippedRecordSchema)
});

export const importRequestSchema = z.object({
  filename: z.string().min(1).default("leads.csv"),
  headers: z.array(z.string()).min(1),
  rows: z.array(csvRowSchema).min(1)
});

export type ImportRequest = z.infer<typeof importRequestSchema>;
