import { logger } from "../config/logger.js";
import type { BatchMappingInput, BatchMappingResult, CrmMapper } from "./crmMapper.js";

export class FallbackCrmMapper implements CrmMapper {
  readonly name: string;

  constructor(
    private readonly primary: CrmMapper,
    private readonly fallback: CrmMapper
  ) {
    this.name = `${primary.name}+${fallback.name}-fallback`;
  }

  async mapRows(input: BatchMappingInput): Promise<BatchMappingResult> {
    try {
      return await this.primary.mapRows(input);
    } catch (error) {
      logger.warn(
        {
          error: error instanceof Error ? error.message : "Unknown AI mapper error",
          provider: this.primary.name,
          fallback: this.fallback.name
        },
        "Primary CRM mapper failed; using fallback mapper"
      );
      return this.fallback.mapRows(input);
    }
  }
}

