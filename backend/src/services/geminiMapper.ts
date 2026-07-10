import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { buildCrmPrompt } from "../prompts/crmPrompt.js";
import { aiBatchResponseSchema } from "../validators/crmSchemas.js";
import { ensureAiBatchCoverage, repairAiBatchResponse } from "../utils/aiRepair.js";
import { extractJsonObject } from "../utils/json.js";
import type { BatchMappingInput, BatchMappingResult, CrmMapper } from "./crmMapper.js";

export class GeminiCrmMapper implements CrmMapper {
  readonly name = "gemini-2.5-flash";
  private readonly client: GoogleGenAI;

  constructor(
    apiKey = env.GEMINI_API_KEY,
    private readonly model = env.GEMINI_MODEL
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async mapRows(input: BatchMappingInput): Promise<BatchMappingResult> {
    const prompt = buildCrmPrompt(input);
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const text = response.text ?? "";
    const parsed = extractJsonObject(text);
    const validation = aiBatchResponseSchema.safeParse(parsed);

    if (validation.success) {
      return ensureAiBatchCoverage(validation.data, input);
    }

    return repairAiBatchResponse(parsed, input);
  }
}
