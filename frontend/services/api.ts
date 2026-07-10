import type { CsvPreview, HistoryEntry, ImportResult } from "@/types/import";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message ?? "Request failed.";
    throw new Error(message);
  }

  return data as T;
}

export async function uploadCsvToBackend(file: File): Promise<CsvPreview> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData
  });

  return parseResponse<CsvPreview>(response);
}

export async function importRows(payload: Pick<CsvPreview, "filename" | "headers" | "rows">): Promise<ImportResult> {
  const response = await fetch(`${API_URL}/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseResponse<ImportResult>(response);
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const response = await fetch(`${API_URL}/history`, {
    cache: "no-store"
  });
  const data = await parseResponse<{ history: HistoryEntry[] }>(response);
  return data.history;
}

export async function getImport(id: string): Promise<ImportResult> {
  const response = await fetch(`${API_URL}/import/${id}`, {
    cache: "no-store"
  });
  return parseResponse<ImportResult>(response);
}

export async function deleteImport(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/import/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    await parseResponse<never>(response);
  }
}
