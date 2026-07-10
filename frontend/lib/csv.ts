import Papa from "papaparse";
import type { CsvPreview, CsvRow, ParsedCrmLead } from "@/types/import";

export function parseCsvFile(file: File): Promise<CsvPreview> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors[0]?.message ?? "Unable to parse CSV."));
          return;
        }

        const headers = result.meta.fields?.filter(Boolean) ?? [];
        const rows = result.data.filter((row) => Object.values(row).some(Boolean));

        if (headers.length === 0) {
          reject(new Error("CSV file does not include headers."));
          return;
        }

        if (rows.length === 0) {
          reject(new Error("CSV file does not include data rows."));
          return;
        }

        resolve({
          filename: file.name,
          headers,
          rows,
          preview: rows.slice(0, 10),
          statistics: {
            totalRows: rows.length,
            totalColumns: headers.length
          }
        });
      },
      error: (error) => reject(error)
    });
  });
}

export function toCsv(records: ParsedCrmLead[]): string {
  const fields: Array<keyof ParsedCrmLead> = [
    "created_at",
    "name",
    "email",
    "country_code",
    "mobile_without_country_code",
    "company",
    "city",
    "state",
    "country",
    "lead_owner",
    "crm_status",
    "crm_note",
    "data_source",
    "possession_time",
    "description"
  ];

  return Papa.unparse(
    records.map((record) => {
      return fields.reduce<Record<string, string>>((accumulator, field) => {
        accumulator[field] = String(record[field] ?? "").replace(/\r?\n/g, "\\n");
        return accumulator;
      }, {});
    })
  );
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function templateCsv(): string {
  return Papa.unparse([
    {
      created_at: "",
      name: "",
      email: "",
      country_code: "",
      mobile_without_country_code: "",
      company: "",
      city: "",
      state: "",
      country: "",
      lead_owner: "",
      crm_status: "",
      crm_note: "",
      data_source: "",
      possession_time: "",
      description: ""
    }
  ]);
}
