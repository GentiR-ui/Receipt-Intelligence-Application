import { Router } from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

const router = Router();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
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

const EXTRACTION_PROMPT = `You are a receipt data extraction engine and financial analyst. Analyze this receipt image and extract structured data.

Return ONLY valid JSON — no markdown, no code fences, no explanation. Use exactly this structure:
{
  "vendor": "store name or null",
  "date": "YYYY-MM-DD or null",
  "currency": "ISO 4217 code like USD, EUR, GBP or null",
  "category": "one of: Food & Dining, Groceries, Transportation, Accommodation, Shopping, Healthcare, Entertainment, Utilities, Other, or null",
  "total": numeric total amount or null,
  "items": [
    { "name": "item description", "quantity": numeric or null, "price": numeric or null }
  ],
  "insights": [
    "one concise financial insight or context about this receipt (1 sentence)",
    "one optional second insight if genuinely useful, otherwise omit"
  ]
}

Rules:
- Never invent values for vendor, date, currency, category, total, or items. Use null if unreadable.
- items should be an empty array [] if no line items are visible.
- total is a plain number (no currency symbol).
- date must be YYYY-MM-DD format or null.
- insights must be an array of 1–2 short strings (never empty). Provide practical financial context:
  examples: "This grocery spend is within a typical weekly budget for a single person.",
            "Dining out expenses like this are often reducible by 30–40% with meal prepping.",
            "Business travel receipts in this category are generally tax-deductible.",
  Keep each insight under 120 characters. Never reference unreadable or null fields.`;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");
  return new GoogleGenAI({ apiKey });
}

// In-memory duplicate detection (session-scoped, resets on server restart)
const processedReceipts = new Set<string>();

function duplicateKey(vendor: string | null, date: string | null, total: number | null): string {
  return `${(vendor ?? "").toLowerCase().trim()}|${date ?? ""}|${total ?? ""}`;
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
            { inlineData: { mimeType: req.file.mimetype, data: base64Data } },
            { text: EXTRACTION_PROMPT },
          ],
        },
      ],
      config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const rawText = response.text ?? "";

    let extraction: Record<string, unknown>;
    try {
      extraction = JSON.parse(rawText);
    } catch {
      req.log.error({ rawText }, "Failed to parse Gemini JSON response");
      res.status(500).json({ error: "AI returned an unparseable response. Please try again." });
      return;
    }

    // Ensure insights is always an array
    if (!Array.isArray(extraction.insights)) {
      extraction.insights = [];
    }

    // Duplicate detection — only check when we have meaningful identifying fields
    const key = duplicateKey(
      extraction.vendor as string | null,
      extraction.date as string | null,
      extraction.total as number | null,
    );
    const hasIdentity = (extraction.vendor || extraction.date) && extraction.total !== null;

    if (hasIdentity && processedReceipts.has(key)) {
      req.log.warn({ key }, "Duplicate receipt detected");
      res.status(409).json({
        error: "Potential duplicate detected: a receipt from this vendor, on this date, with the same total was already processed in this session.",
      });
      return;
    }

    if (hasIdentity) {
      processedReceipts.add(key);
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
