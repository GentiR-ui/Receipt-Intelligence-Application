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
$env:GEMINI_API_KEY = "Your Gemini API KEY"
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

### prompt 1
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

### prompt 2
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

### prompt 3
Implement the CSV export functionality for the receipt results (Bonus Requirement).

Requirements:

Add an "Export to CSV" button next to the "Analyze Another Receipt" button in the success state.
Use the Download icon from lucide-react for the button.
When clicked, generate a CSV string containing two sections:
Metadata section (Vendor, Date, Category, Total, Currency).
Line items section (Item Name, Quantity, Price).
Automatically trigger a download of the .csv file to the user's computer.
Name the file dynamically, for example: receipt-export-<vendor-name>.csv.

### prompt 4
Now let's upgrade the application with professional polish and innovative AI features to make it stand out. Please implement the following 5 features:

1. Data Export Capability: Add an "Export to CSV" button in the success state (using a Download icon) that triggers a browser download of the extracted line items and metadata.
2. Error Handling & Validation: We already have 'sonner' in package.json. Implement toast notifications for all errors or success states. Ensure the 'Retry' button works flawlessly if the AI fails.
3. Clean Logging: Add a 'Processing Log' text indicator below the loading skeleton that updates the user on the current step (e.g., cycles through 'Uploading Image...' -> 'Analyzing Image with Gemini...' -> 'Finalizing Data...'). Use a useEffect with timeouts to simulate these step updates while uploadState is 'loading'.
4. Smart Budgeting Insights (AI Analyst): Modify the backend Gemini prompt to also return an `insights` field (array of strings). Instruct the AI to provide 1-2 bullet points of financial insights or context based on the receipt (e.g., "This expense is typical for this category"). Display these insights in a new 'AI Insights' section in the UI with a sparkle/AI icon.
5. Fraud & Duplicate Detection: Add a basic backend mechanism (using an in-memory Set or array) that tracks the `vendor + date + total` of successfully processed receipts. If the exact same combination is uploaded in the same session, return a 409 Conflict error saying "Potential Duplicate Detected". Show this error gracefully in the frontend using a toast notification and the error state.

Ensure the UI remains highly responsive and the drag-and-drop zone works perfectly on mobile devices.

### prompt 5
Please configure the Vite dev server in vite.config.ts so that /api requests are proxied to the local backend at http://127.0.0.1:3001, without committing local .env secrets.

### prompt 6

Now, create a comprehensive and professional README.md for this project to prepare it for submission.
Requirements:
1. Project Title & Description: Explain that this is a "Receipt → Spreadsheet" tool using Gemini Vision.
2. How to Run: Provide exact commands to run the project from a fresh clone (e.g., how to install dependencies, run the frontend and backend, and set up the .env file with the Gemini API key). This must be clear enough that anyone can run it in under 5 minutes.
3. Architecture: Briefly explain the React + Express stack.
4. Prompts Used: Create a section that documents the exact prompts used to build this project (I will provide the text for you to insert).
5. Future Improvements: Add a "What I would do with more time" section mentioning things like database integration, user authentication, and multi-receipt bulk upload.
Make it look polished with standard markdown formatting.



### prompt 7
Please refactor the main React application to implement a professional multi-tab navigation layout (Dashboard, Upload, History, Settings) and a split-screen dashboard view, matching a high-end modern SaaS interface.
1. Navigation Header (Navbar):
Create a clean top navigation bar. On the left, place the logo and app name 'Receipt Intelligence'.  On the right, place navigation links/tabs: Dashboard, Upload, History, and Settings.  Manage the active tab using React state (e.g., activeTab).
2. Dashboard Tab Layout (Split-Screen View):When the active tab is 'Dashboard' (or 'Upload'), wrap the workspace in a responsive Tailwind grid: grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto px-4 mt-6.Left Column (lg:col-span-4): Place the dropzone area here. Keep it compact. Below the dropzone, if an image is uploaded, show a clean, high-quality preview thumbnail of the uploaded receipt.  Right Column (lg:col-span-8): Place the Extracted Data card here.  
3. Component Refactoring within Dashboard:Transform the standard text displays for Vendor, Date, Category, Currency, and Total into clean, interactive input fields (or select dropdowns for category/currency) so the user can edit them. Style them with a subtle border focus (focus:ring-2 focus:ring-blue-500).  Add a badge in the top right corner of the results card that says '✨ Gemini AI'.  Refactor the Line Items table: turn the Item Description, Qty, and Price text into editable inline input fields inside the table rows. Add a table footer with a summary breakdown showing: Subtotal, Tax, and Total.  Add a primary 'Save Changes' action button at the bottom right of the card next to the 'Analyze Another' button. 
 4. History Tab Layout:When the user clicks on the 'History' tab, hide the upload workspace and display a full-width section dedicated to tracking past expenses.  Move the existing 'Recent Receipts' list into this tab, but transform it into a more robust data table or grid that lists all previously uploaded receipts, their vendors, dates, categories, totals, and a 'View Details' button.Keep the existing styling tokens (fonts, background colors) intact but tighten up the spacing so components align beautifully without excessive scrolling.

 In this prompt I generated a photo of how it would look better so the prompt is generated from that photo of a layout of the UI/UX.

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
Also make sure you have `PORT` and `GEMINI_API_KEY` before runnig the backend:

```powershell
cd artifacts/api-server
$env:PORT = "3001"
$env:GEMINI_API_KEY = "Your Gemini API KEY"
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
