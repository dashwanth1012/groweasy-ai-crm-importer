import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import { repositories, services } from "../services/serviceFactory.js";
import { parseCsvBuffer } from "../utils/csv.js";
import { AppError } from "../utils/errors.js";
import { importRequestSchema } from "../validators/crmSchemas.js";

const CSV_MIME_TYPES = new Set(["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"]);

function isCsvUpload(file: Express.Multer.File) {
  const filename = file.originalname.toLowerCase();
  return filename.endsWith(".csv") && CSV_MIME_TYPES.has(file.mimetype);
}

export const health: RequestHandler = (_req, res) => {
  res.json({
    ok: true,
    service: "groweasy-ai-crm-importer-api",
    provider: services.mapper.name,
    geminiConfigured: Boolean(env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
};

export const uploadCsv: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError("Upload a CSV file under the file field.", 400, "FILE_REQUIRED");
    }

    if (!isCsvUpload(req.file)) {
      throw new AppError("Only CSV files are supported.", 400, "INVALID_FILE_TYPE");
    }

    const parsed = await parseCsvBuffer(req.file.buffer);

    res.json({
      filename: req.file.originalname,
      ...parsed
    });
  } catch (error) {
    next(error);
  }
};

export const importCsv: RequestHandler = async (req, res, next) => {
  try {
    const payload = importRequestSchema.parse(req.body);
    const result = await services.import.importRows(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const listHistory: RequestHandler = async (_req, res, next) => {
  try {
    const history = await repositories.history.list();
    res.json({ history });
  } catch (error) {
    next(error);
  }
};

export const getImportById: RequestHandler = async (req, res, next) => {
  try {
    const stored = await repositories.history.findById(req.params.id);

    if (!stored) {
      throw new AppError("Import not found.", 404, "IMPORT_NOT_FOUND");
    }

    res.json(stored);
  } catch (error) {
    next(error);
  }
};

export const deleteImportById: RequestHandler = async (req, res, next) => {
  try {
    const deleted = await repositories.history.deleteById(req.params.id);

    if (!deleted) {
      throw new AppError("Import not found.", 404, "IMPORT_NOT_FOUND");
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
