import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { logger } from "../config/logger.js";
import { chunk } from "../utils/batch.js";
import { withRetry } from "../utils/retry.js";
import type { HistoryRepository } from "../repositories/historyRepository.js";
import type { BatchTimelineEntry, CsvRow, ImportResult, ParsedCrmLead, SkippedRecord } from "../types/crm.js";
import type { ImportRequest } from "../validators/crmSchemas.js";
import type { CrmMapper } from "./crmMapper.js";

const BATCH_SIZE = 25;

export class ImportService {
  constructor(
    private readonly mapper: CrmMapper,
    private readonly historyRepository: HistoryRepository
  ) {}

  async importRows(request: ImportRequest): Promise<ImportResult> {
    const startedAt = performance.now();
    const createdAt = new Date().toISOString();
    const batches = chunk(
      request.rows.map((row, sourceRowIndex) => ({ ...row, sourceRowIndex })),
      BATCH_SIZE
    );
    const records: ParsedCrmLead[] = [];
    const skippedRecords: SkippedRecord[] = [];
    const timeline: BatchTimelineEntry[] = [];
    let failed = 0;

    for (const [batchIndex, batchRows] of batches.entries()) {
      const batchStartedAt = performance.now();
      let attempts = 1;

      try {
        const { value, attempts: completedAttempts } = await withRetry(
          async (attempt) => {
            attempts = attempt;
            return this.mapper.mapRows({
              headers: request.headers,
              rows: batchRows
            });
          },
          {
            retries: 2,
            baseDelayMs: 600,
            timeoutMs: 35_000
          },
          (attempt, error) => {
            logger.warn({ error, attempt, batch: batchIndex + 1 }, "Retrying CRM mapping batch");
          }
        );

        records.push(...value.records);
        skippedRecords.push(...value.skippedRecords);
        timeline.push({
          batch: batchIndex + 1,
          totalBatches: batches.length,
          attempts: completedAttempts,
          imported: value.records.length,
          skipped: value.skippedRecords.length,
          failed: 0,
          durationMs: Math.round(performance.now() - batchStartedAt),
          status: completedAttempts > 1 ? "retried" : "completed",
          message: completedAttempts > 1 ? "Batch completed after retry" : "Batch completed"
        });
      } catch (error) {
        failed += batchRows.length;
        skippedRecords.push(...batchRows.map((row) => createFailedSkippedRecord(row, error)));
        timeline.push({
          batch: batchIndex + 1,
          totalBatches: batches.length,
          attempts,
          imported: 0,
          skipped: batchRows.length,
          failed: batchRows.length,
          durationMs: Math.round(performance.now() - batchStartedAt),
          status: "failed",
          message: error instanceof Error ? error.message : "Batch failed"
        });
      }
    }

    const processingTimeMs = Math.round(performance.now() - startedAt);
    const averageBatchTimeMs =
      timeline.length === 0 ? 0 : Math.round(timeline.reduce((total, entry) => total + entry.durationMs, 0) / timeline.length);
    const estimatedTokens = estimateImportTokens(request.rows);
    const imported = records.length;
    const skipped = skippedRecords.length;
    const successRate = request.rows.length === 0 ? 0 : Math.round((imported / request.rows.length) * 1000) / 10;
    const status = failed > 0 && imported > 0 ? "partial" : failed > 0 ? "failed" : "completed";
    const result: ImportResult = {
      id: randomUUID(),
      filename: request.filename,
      createdAt,
      headers: request.headers,
      records: records.sort((a, b) => a.sourceRowIndex - b.sourceRowIndex),
      skippedRecords: skippedRecords.sort((a, b) => a.sourceRowIndex - b.sourceRowIndex),
      statistics: {
        totalRows: request.rows.length,
        totalColumns: request.headers.length,
        imported,
        skipped,
        failed,
        successRate,
        processingTimeMs,
        batches: batches.length,
        averageBatchTimeMs,
        estimatedTokens,
        provider: this.mapper.name,
        status
      },
      timeline
    };

    await this.historyRepository.save(result);
    return result;
  }
}

function estimateImportTokens(rows: CsvRow[]): number {
  const characters = JSON.stringify(rows).length;
  return Math.max(1, Math.ceil(characters / 4));
}

function createFailedSkippedRecord(row: CsvRow & { sourceRowIndex: number }, error: unknown): SkippedRecord {
  const { sourceRowIndex, ...raw } = row;

  return {
    sourceRowIndex,
    reason: error instanceof Error ? error.message : "AI processing failed",
    raw
  };
}
