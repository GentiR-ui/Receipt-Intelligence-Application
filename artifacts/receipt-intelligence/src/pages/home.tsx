import { useState, useCallback, useRef, useEffect } from 'react';
import {
  UploadCloud, FileText, AlertCircle, X, Loader2, RotateCcw,
  Receipt, Tag, Calendar, DollarSign, ShoppingCart, Download,
  Clock, Trash2, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ReceiptLineItem {
  name: string | null;
  quantity: number | null;
  price: number | null;
}

interface ReceiptExtraction {
  vendor: string | null;
  date: string | null;
  currency: string | null;
  category: string | null;
  total: number | null;
  items: ReceiptLineItem[];
}

interface HistoryEntry {
  id: string;
  filename: string;
  analyzedAt: string;
  extraction: ReceiptExtraction;
}

const HISTORY_KEY = 'receipt-intelligence:history';
const MAX_HISTORY = 20;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

function formatCurrency(amount: number | null, currency: string | null): string {
  if (amount === null) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency ?? 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency ?? ''} ${amount.toFixed(2)}`.trim();
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function MetaField({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/30">
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value ?? '—'}</p>
      </div>
    </div>
  );
}

function ExtractionResults({
  extraction,
  onExportCsv,
  onNewReceipt,
  filename,
}: {
  extraction: ReceiptExtraction;
  onExportCsv: () => void;
  onNewReceipt: () => void;
  filename?: string;
}) {
  return (
    <div className="space-y-5 animate-in fade-in duration-500" data-testid="extraction-results">
      {filename && (
        <p className="text-xs text-muted-foreground text-center">
          <span className="font-medium text-foreground">{filename}</span>
        </p>
      )}

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Extracted Data</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <MetaField icon={Receipt} label="Vendor" value={extraction.vendor} />
          <MetaField icon={Calendar} label="Date" value={extraction.date} />
          <MetaField icon={Tag} label="Category" value={extraction.category} />
          <MetaField icon={DollarSign} label="Total" value={formatCurrency(extraction.total, extraction.currency)} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <ShoppingCart className="w-3.5 h-3.5" />
          Line Items
          {extraction.items.length > 0 && (
            <span className="ml-auto font-normal normal-case text-xs bg-muted px-2 py-0.5 rounded-full">
              {extraction.items.length} item{extraction.items.length !== 1 ? 's' : ''}
            </span>
          )}
        </h3>

        {extraction.items.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
            No line items found on this receipt.
          </div>
        ) : (
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <table className="w-full text-sm" data-testid="table-line-items">
              <thead>
                <tr className="bg-muted/50 border-b border-border/40">
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Item</th>
                  <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-16">Qty</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-24">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {extraction.items.map((item, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors" data-testid={`row-item-${i}`}>
                    <td className="px-4 py-2.5 text-foreground">{item.name ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center text-muted-foreground">{item.quantity ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-foreground tabular-nums">
                      {formatCurrency(item.price, extraction.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              {extraction.total !== null && (
                <tfoot>
                  <tr className="bg-muted/40 border-t border-border/60">
                    <td colSpan={2} className="px-4 py-2.5 font-semibold text-foreground">Total</td>
                    <td className="px-4 py-2.5 text-right font-bold text-foreground tabular-nums">
                      {formatCurrency(extraction.total, extraction.currency)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onExportCsv} data-testid="button-export-csv" className="gap-2">
          <Download className="w-3.5 h-3.5" />
          Export to CSV
        </Button>
        <Button variant="ghost" size="sm" onClick={onNewReceipt} data-testid="button-new-receipt" className="gap-2">
          <RotateCcw className="w-3.5 h-3.5" />
          Analyze Another Receipt
        </Button>
      </div>
    </div>
  );
}

export default function Home() {
  const [uploadState, setUploadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [extraction, setExtraction] = useState<ReceiptExtraction | null>(null);
  const [activeFilename, setActiveFilename] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const applyFile = useCallback((file: File) => {
    if (file.size > MAX_SIZE) {
      setErrorMsg('File must be under 10MB.');
      setUploadState('error');
      return;
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      setErrorMsg('Only JPEG, PNG, WEBP, and PDF files are supported.');
      setUploadState('error');
      return;
    }
    setSelectedFile(file);
    setErrorMsg(null);
    setUploadState('idle');
    setExtraction(null);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const clearAll = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadState('idle');
    setErrorMsg(null);
    setExtraction(null);
    setActiveFilename('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) applyFile(e.dataTransfer.files[0]);
  }, [applyFile]);
  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) applyFile(e.target.files[0]);
  }, [applyFile]);

  function buildCsv(data: ReceiptExtraction): string {
    const escape = (v: string | number | null) => {
      if (v === null || v === undefined) return '';
      const str = String(v);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    };
    return [
      'Section,Field,Value',
      `Metadata,Vendor,${escape(data.vendor)}`,
      `Metadata,Date,${escape(data.date)}`,
      `Metadata,Category,${escape(data.category)}`,
      `Metadata,Currency,${escape(data.currency)}`,
      `Metadata,Total,${escape(data.total)}`,
      '',
      'Line Items,Item Name,Quantity,Price',
      ...data.items.map(item =>
        `Line Items,${escape(item.name)},${escape(item.quantity)},${escape(item.price)}`
      ),
    ].join('\n');
  }

  function triggerDownload(csv: string, vendor: string | null) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (vendor ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    a.href = url;
    a.download = `receipt-export-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportToCsv() {
    if (!extraction) return;
    triggerDownload(buildCsv(extraction), extraction.vendor);
  }

  function exportHistoryEntry(entry: HistoryEntry) {
    triggerDownload(buildCsv(entry.extraction), entry.extraction.vendor);
  }

  async function handleAnalyze() {
    if (!selectedFile) return;
    setUploadState('loading');
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch('/api/extract', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? 'Extraction failed');
      }
      const data: ReceiptExtraction = await res.json();
      setExtraction(data);
      setActiveFilename(selectedFile.name);
      setUploadState('success');

      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        filename: selectedFile.name,
        analyzedAt: new Date().toISOString(),
        extraction: data,
      };
      setHistory(prev => [entry, ...prev]);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Extraction failed');
      setUploadState('error');
    }
  }

  function openHistoryEntry(entry: HistoryEntry) {
    clearAll();
    setExtraction(entry.extraction);
    setActiveFilename(entry.filename);
    setUploadState('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteHistoryEntry(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setHistory(prev => prev.filter(h => h.id !== id));
  }

  function clearHistory() {
    setHistory([]);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-sm shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold tracking-tight text-foreground text-sm">Receipt Intelligence</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2">Automated extraction for finance teams</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-foreground">Stop typing receipts.</h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
            Upload any receipt or invoice. Gemini Vision extracts vendor, totals, and line items instantly.
          </p>
        </div>

        {/* Main card */}
        <Card className="border-border/60 shadow-lg shadow-primary/5">
          <CardContent className="p-5 sm:p-8 space-y-5">

            {uploadState !== 'success' && (
              <div
                className={`relative rounded-xl border-2 border-dashed transition-colors duration-200 overflow-hidden
                  ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
                  ${selectedFile ? 'p-0' : 'p-10'}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                data-testid="upload-zone"
              >
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={onFileSelect}
                  ref={fileInputRef}
                  disabled={uploadState === 'loading'}
                  data-testid="input-file"
                />
                {selectedFile ? (
                  <div className="w-full">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-sm relative z-20">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {previewUrl
                          ? <img src={previewUrl} alt="Preview" className="w-9 h-9 object-cover rounded border border-border shrink-0" />
                          : <div className="w-9 h-9 bg-primary/10 rounded flex items-center justify-center text-primary shrink-0"><FileText className="w-4 h-4" /></div>
                        }
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 rounded-full relative z-30 shrink-0"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); clearAll(); }}
                        disabled={uploadState === 'loading'}
                        data-testid="button-clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {previewUrl && (
                      <div className="w-full bg-muted/20 flex items-center justify-center max-h-52 overflow-hidden">
                        <img src={previewUrl} alt="Receipt preview" className="max-h-52 object-contain p-3" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center pointer-events-none">
                    <div className="w-14 h-14 mb-3 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-base font-medium text-foreground mb-1">Drop your receipt here</p>
                    <p className="text-sm text-muted-foreground">JPEG, PNG, WEBP, or PDF — up to 10MB</p>
                  </div>
                )}
              </div>
            )}

            {uploadState === 'error' && (
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-destructive/10 text-destructive" data-testid="alert-error">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Extraction failed</p>
                  <p className="text-sm opacity-80 mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {uploadState === 'loading' && (
              <div className="space-y-3 animate-pulse" data-testid="loading-skeleton">
                <div className="h-5 bg-muted rounded w-1/3" />
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg" />)}
                </div>
                <div className="h-5 bg-muted rounded w-1/4 mt-2" />
                <div className="h-32 bg-muted rounded-lg" />
              </div>
            )}

            {uploadState === 'success' && extraction && (
              <ExtractionResults
                extraction={extraction}
                filename={activeFilename}
                onExportCsv={exportToCsv}
                onNewReceipt={clearAll}
              />
            )}

            {uploadState !== 'success' && (
              <Button
                className="w-full h-11 text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all"
                onClick={handleAnalyze}
                disabled={!selectedFile || uploadState === 'loading'}
                data-testid="button-analyze"
              >
                {uploadState === 'loading' ? (
                  <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Extracting...</>
                ) : (
                  'Analyze Receipt'
                )}
              </Button>
            )}

          </CardContent>
        </Card>

        {/* History panel */}
        {history.length > 0 && (
          <div className="mt-8" data-testid="history-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Recent Receipts
                <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {history.length}
                </span>
              </h3>
              <button
                onClick={clearHistory}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                data-testid="button-clear-history"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => openHistoryEntry(entry)}
                  className="group flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:border-primary/40 hover:bg-muted/30 cursor-pointer transition-all"
                  data-testid={`history-entry-${entry.id}`}
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {entry.extraction.vendor ?? entry.filename}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <span>{entry.filename}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(entry.analyzedAt)}</span>
                      {entry.extraction.total !== null && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(entry.extraction.total, entry.extraction.currency)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); exportHistoryEntry(entry); }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Export to CSV"
                      data-testid={`button-export-history-${entry.id}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => deleteHistoryEntry(entry.id, e)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete"
                      data-testid={`button-delete-history-${entry.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
