import { Router } from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const router = Router();

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

const EXTRACTION_PROMPT = `You are a receipt data extraction engine. Analyze this receipt image and extract structured data.

Return ONLY valid JSON — no markdown, no code fences, no explanation. Use exactly this structure:
{
  "vendor": "store name or null",
  "date": "YYYY-MM-DD or null",
  "currency": "ISO 4217 code like USD, EUR, GBP or null",
  "category": "one of: Food & Dining, Groceries, Transportation, Accommodation, Shopping, Healthcare, Entertainment, Utilities, Other, or null",
  "total": numeric total amount or null,
  "items": [
    { "name": "item description", "quantity": numeric or null, "price": numeric or null }
  ]
}

Rules:
- Never invent values. If a field is unreadable or absent, use null.
- items should be an empty array [] if no line items are visible.
- total is a plain number (no currency symbol).
- date must be YYYY-MM-DD format or null.`;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
}

router.post("/extract", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded. Please attach a receipt image." });
    return;
  }

  let ai: GoogleGenAI;
  try {
    ai = getClient();
  } catch {
    req.log.error("GEMINI_API_KEY is not configured");
    res.status(500).json({ error: "AI extraction is not configured. GEMINI_API_KEY is missing." });
    return;
  }

  try {
    const base64Data = req.file.buffer.toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: base64Data,
              },
            },
            { text: EXTRACTION_PROMPT },
          ],
        },
      ],
      config: {
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text ?? "";

    let extraction: unknown;
    try {
      extraction = JSON.parse(rawText);
    } catch {
      req.log.error({ rawText }, "Failed to parse Gemini JSON response");
      res.status(500).json({ error: "AI returned an unparseable response. Please try again." });
      return;
    }

    req.log.info({ filename: req.file.originalname }, "Receipt extracted successfully");
    res.json(extraction);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err: message }, "Gemini extraction failed");
    res.status(500).json({ error: `Extraction failed: ${message}` });
  }
});

export default router;
