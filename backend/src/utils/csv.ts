import csvParser from "csv-parser";
import { Readable } from "node:stream";
import type { CsvRow } from "../types/crm.js";
import { AppError } from "./errors.js";

export interface CsvParseResult {
  headers: string[];
  rows: CsvRow[];
  preview: CsvRow[];
  statistics: {
    totalRows: number;
    totalColumns: number;
  };
}

export async function parseCsvBuffer(buffer: Buffer, previewLimit = 10): Promise<CsvParseResult> {
  const rows: CsvRow[] = [];
  let headers: string[] = [];
  const text = buffer.toString("utf8").replace(/^\uFEFF/, "");

  if (!text.trim()) {
    throw new AppError("CSV file is empty.", 400, "EMPTY_CSV");
  }

  await new Promise<void>((resolve, reject) => {
    Readable.from(text)
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => header.trim(),
          mapValues: ({ value }) => String(value ?? "").trim()
        })
      )
      .on("headers", (detectedHeaders: string[]) => {
        headers = detectedHeaders.filter(Boolean);
      })
      .on("data", (row: CsvRow) => {
        rows.push(row);
      })
      .on("error", reject)
      .on("end", resolve);
  });

  if (headers.length === 0) {
    throw new AppError("CSV file does not include headers.", 400, "CSV_HEADERS_MISSING");
  }

  if (rows.length === 0) {
    throw new AppError("CSV file does not include data rows.", 400, "CSV_ROWS_MISSING");
  }

  return {
    headers,
    rows,
    preview: rows.slice(0, previewLimit),
    statistics: {
      totalRows: rows.length,
      totalColumns: headers.length
    }
  };
}

