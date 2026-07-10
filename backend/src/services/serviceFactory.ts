import { env } from "../config/env.js";
import { HistoryRepository } from "../repositories/historyRepository.js";
import { FallbackCrmMapper } from "./fallbackCrmMapper.js";
import { GeminiCrmMapper } from "./geminiMapper.js";
import { ImportService } from "./importService.js";
import { LocalSemanticMapper } from "./localSemanticMapper.js";
import type { CrmMapper } from "./crmMapper.js";

const historyRepository = new HistoryRepository();
const localMapper = new LocalSemanticMapper();
const mapper: CrmMapper = env.GEMINI_API_KEY ? new FallbackCrmMapper(new GeminiCrmMapper(), localMapper) : localMapper;

export const importService = new ImportService(mapper, historyRepository);
export const repositories = {
  history: historyRepository
};
export const services = {
  import: importService,
  mapper
};
