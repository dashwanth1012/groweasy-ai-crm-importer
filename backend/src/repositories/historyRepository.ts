import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { HistoryEntry, ImportResult, StoredImport } from "../types/crm.js";

interface HistoryStore {
  imports: StoredImport[];
}

export class HistoryRepository {
  constructor(private readonly filePath = path.join(process.cwd(), "data", "import-history.json")) {}

  async list(): Promise<HistoryEntry[]> {
    const store = await this.readStore();
    return store.imports.map((entry) => entry.history).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async findById(id: string): Promise<StoredImport | null> {
    const store = await this.readStore();
    return store.imports.find((entry) => entry.id === id) ?? null;
  }

  async deleteById(id: string): Promise<boolean> {
    const store = await this.readStore();
    const before = store.imports.length;
    store.imports = store.imports.filter((entry) => entry.id !== id);

    if (store.imports.length === before) {
      return false;
    }

    await this.writeStore(store);
    return true;
  }

  async save(result: ImportResult): Promise<StoredImport> {
    const history: HistoryEntry = {
      id: result.id,
      timestamp: result.createdAt,
      filename: result.filename,
      totalRows: result.statistics.totalRows,
      imported: result.statistics.imported,
      skipped: result.statistics.skipped,
      failed: result.statistics.failed,
      successRate: result.statistics.successRate,
      status: result.statistics.status,
      processingTimeMs: result.statistics.processingTimeMs
    };
    const stored: StoredImport = { ...result, history };
    const store = await this.readStore();
    store.imports = [stored, ...store.imports].slice(0, 100);
    await this.writeStore(store);
    return stored;
  }

  private async readStore(): Promise<HistoryStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as HistoryStore;
    } catch {
      return { imports: [] };
    }
  }

  private async writeStore(store: HistoryStore): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(store, null, 2), "utf8");
  }
}
