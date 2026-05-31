# Receipt Intelligence

A polished "Receipt → Spreadsheet" tool built with Gemini Vision.

This application lets users upload receipt and invoice images, extracts structured receipt data with Gemini Vision, and displays vendor, date, category, total, line items, and AI-generated budgeting insights in a modern SaaS-style UI.

## Key Features

- Drag-and-drop receipt upload
- Gemini Vision backend extraction via Google Vertex AI
- Frontend results view with vendor, date, category, currency, total, and line items
- CSV export for extracted receipts
- Duplicate detection and graceful error handling
- Responsive React UI built with TailwindCSS

## Tech Stack

- Frontend: React + Vite + TailwindCSS
- Backend: Express + Multer + Google Gemini Vision
- Dev tooling: pnpm workspace

## Run the project locally

### Prerequisites

- Node.js 18+ installed
- `pnpm` installed globally
- Google Gemini API key

### Clone and install

```powershell
git clone https://github.com/GentiR-ui/Receipt-Intelligence-Application.git
cd Receipt-Intelligence-Application
pnpm install
```

### Configure the backend environment

The API server requires `GEMINI_API_KEY` and `PORT` environment variables.

**From the project root:**

```powershell
cd artifacts/api-server
cp .env.example .env
```

Then edit `artifacts/api-server/.env` and add your Gemini API key:

```text
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
```

> **Important:** Never commit `.env` to git. The `.gitignore` file already excludes it.

### Start the backend

In PowerShell (from `artifacts/api-server`):

```powershell
cd artifacts/api-server
$env:PORT = "3001"
$env:GEMINI_API_KEY- = "Your Gemini API KEY"
pnpm run dev
```

The backend will load `GEMINI_API_KEY` and `PORT` from `.env` automatically and start on port 3001.

For macOS / Linux:

```bash
cd artifacts/api-server
pnpm run dev
```

### Start the frontend

In a second terminal (from project root):

```powershell
cd artifacts/receipt-intelligence
$env:PORT = "5173"
$env:BASE_PATH = "/"
pnpm run dev
```

Or in macOS / Linux:

```bash
cd artifacts/receipt-intelligence
PORT=5173 BASE_PATH=/ pnpm run dev
```

### Open the app

Visit the frontend in the browser at:

- `http://127.0.0.1:5173`

The frontend is configured to proxy `/api` calls to the backend at `http://127.0.0.1:3001`.

## Architecture

This repository uses a workspace-style MonoRepo.

- `artifacts/receipt-intelligence`: React frontend with Vite and TailwindCSS.
- `artifacts/api-server`: Express backend that exposes a `POST /api/extract` endpoint.

The frontend uploads receipt images using `fetch('/api/extract')`, while the backend accepts the file with Multer, sends it to Gemini Vision, and returns structured JSON.

## Prompts Used

### prompti 1
Create a full-stack application called Receipt Intelligence.

Tech Stack:

React frontend
Express backend
TailwindCSS
Requirements:

Modern SaaS-style UI
Responsive layout
Landing page with receipt upload area
Drag and drop file upload
Image preview after upload
Results section placeholder
Loading state placeholder
Error state placeholder
Do not implement AI extraction yet.
Do not add authentication, database, or analytics.
Keep the code simple and production-ready.

### prompti 2
Implement AI receipt extraction using Google Vertex AI Gemini.

Requirements:

Backend:

Create a POST /api/extract endpoint.

Accept an uploaded receipt image.

Use Gemini Vision through Vertex AI.

Extract the following fields:

Vendor
Date
Currency
Total
Category
Line Items
Return ONLY structured JSON in this format:

{
"vendor": "",
"date": "",
"currency": "",
"category": "",
"total": 0,
"items": [
{
"name": "",
"quantity": 1,
"price": 0
}
]
}

Rules:

Never invent values.
Use null when information is unreadable.
Handle API errors gracefully.
Frontend:

Replace the upload success card with extracted receipt results.
Display vendor, date, category, currency, and total.
Show line items in a clean table.
Keep the implementation simple and production-ready.
Do not implement CSV export yet.
Do not implement authentication or database storage

### prompti 3
Implement the CSV export functionality for the receipt results (Bonus Requirement).

Requirements:

Add an "Export to CSV" button next to the "Analyze Another Receipt" button in the success state.
Use the Download icon from lucide-react for the button.
When clicked, generate a CSV string containing two sections:
Metadata section (Vendor, Date, Category, Total, Currency).
Line items section (Item Name, Quantity, Price).
Automatically trigger a download of the .csv file to the user's computer.
Name the file dynamically, for example: receipt-export-<vendor-name>.csv.

### prompti 4
Now let's upgrade the application with professional polish and innovative AI features to make it stand out. Please implement the following 5 features:

1. Data Export Capability: Add an "Export to CSV" button in the success state (using a Download icon) that triggers a browser download of the extracted line items and metadata.
2. Error Handling & Validation: We already have 'sonner' in package.json. Implement toast notifications for all errors or success states. Ensure the 'Retry' button works flawlessly if the AI fails.
3. Clean Logging: Add a 'Processing Log' text indicator below the loading skeleton that updates the user on the current step (e.g., cycles through 'Uploading Image...' -> 'Analyzing Image with Gemini...' -> 'Finalizing Data...'). Use a useEffect with timeouts to simulate these step updates while uploadState is 'loading'.
4. Smart Budgeting Insights (AI Analyst): Modify the backend Gemini prompt to also return an `insights` field (array of strings). Instruct the AI to provide 1-2 bullet points of financial insights or context based on the receipt (e.g., "This expense is typical for this category"). Display these insights in a new 'AI Insights' section in the UI with a sparkle/AI icon.
5. Fraud & Duplicate Detection: Add a basic backend mechanism (using an in-memory Set or array) that tracks the `vendor + date + total` of successfully processed receipts. If the exact same combination is uploaded in the same session, return a 409 Conflict error saying "Potential Duplicate Detected". Show this error gracefully in the frontend using a toast notification and the error state.

Ensure the UI remains highly responsive and the drag-and-drop zone works perfectly on mobile devices.

### prompti 5
Please configure the Vite dev server in vite.config.ts so that /api requests are proxied to the local backend at http://127.0.0.1:3001, without committing local .env secrets.

## What I would do with more time

- Add persistent database storage for uploads and extracted receipts.
- Add user authentication and per-user history.
- Add bulk receipt upload and batch CSV export.
- Add OCR fallback for receipts where Gemini Vision struggles.
- Improve accessibility and user onboarding for first-time users.

## Troubleshooting

### "PORT environment variable is required"

Make sure you set `PORT` and `BASE_PATH` before running the frontend:

```powershell
cd artifacts/receipt-intelligence
$env:PORT = "5173"
$env:BASE_PATH = "/"
pnpm run dev
```

### "GEMINI_API_KEY is not configured"

The backend will fail gracefully if `GEMINI_API_KEY` is missing. Check that you:

1. Created `.env` from `.env.example`
2. Added your actual Gemini API key
3. The backend is running (logs should show `Server listening` on port 3001)

### Frontend returns 404 for `/api/extract`

Make sure:

1. Backend is running on `http://127.0.0.1:3001`
2. Frontend is making requests to `http://127.0.0.1:5173`
3. The Vite proxy in `artifacts/receipt-intelligence/vite.config.ts` includes the `/api` route

## Notes

- Keep your Gemini API key private and never commit `.env` to git.
- The backend accepts receipt images and returns structured JSON from Gemini Vision so the app can turn receipts into spreadsheet-ready data.
