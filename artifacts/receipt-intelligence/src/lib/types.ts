// Shared domain types for the Receipt Intelligence app.
// Import from here in all components to avoid duplicate type definitions.

export interface ReceiptLineItem {
  name: string | null;
  quantity: number | null;
  price: number | null;
}

export interface ReceiptExtraction {
  vendor: string | null;
  date: string | null;
  currency: string | null;
  category: string | null;
  total: number | null;
  items: ReceiptLineItem[];
  insights: string[];
}

export interface HistoryEntry {
  id: string;
  filename: string;
  analyzedAt: string;
  extraction: ReceiptExtraction;
}
