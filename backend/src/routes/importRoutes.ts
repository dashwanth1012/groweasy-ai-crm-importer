import { Router } from "express";
import multer from "multer";
import { deleteImportById, getImportById, health, importCsv, listHistory, uploadCsv } from "../controllers/importController.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1
  }
});

export const router = Router();

router.get("/health", health);
router.post("/upload", upload.single("file"), uploadCsv);
router.post("/import", importCsv);
router.get("/history", listHistory);
router.get("/import/:id", getImportById);
router.delete("/import/:id", deleteImportById);
