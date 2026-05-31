import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";

const router = Router();

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP, PDF.`));
    }
  },
});

router.post("/receipts/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded. Please attach a receipt image." });
    return;
  }

  const result = {
    id: randomUUID(),
    filename: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    status: "pending" as const,
    message: "Receipt uploaded successfully. AI extraction is not yet enabled — results will appear here once processing is implemented.",
    uploadedAt: new Date().toISOString(),
  };

  req.log.info({ receiptId: result.id, filename: result.filename, fileSize: result.fileSize }, "Receipt uploaded");

  res.json(result);
});

export default router;
