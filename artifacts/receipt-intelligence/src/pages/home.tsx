import { useState, useCallback, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, X, Loader2, RotateCcw, Receipt, Tag, Calendar, DollarSign, ShoppingCart } from 'lucide-react';
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

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;

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

export default function Home() {
  const [uploadState, setUploadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [extraction, setExtraction] = useState<ReceiptExtraction | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setUploadState('success');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Extraction failed');
      setUploadState('error');
    }
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

            {/* Upload zone — always visible unless success with no intent to re-upload */}
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

            {/* Error */}
            {uploadState === 'error' && (
              <div className="flex items-start gap-3 p-3.5 rounded-lg bg-destructive/10 text-destructive" data-testid="alert-error">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Extraction failed</p>
                  <p className="text-sm opacity-80 mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Loading skeleton */}
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

            {/* Results */}
            {uploadState === 'success' && extraction && (
              <div className="space-y-5 animate-in fade-in duration-500" data-testid="extraction-results">
                {/* Summary meta fields */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Extracted Data</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <MetaField icon={Receipt} label="Vendor" value={extraction.vendor} />
                    <MetaField icon={Calendar} label="Date" value={extraction.date} />
                    <MetaField icon={Tag} label="Category" value={extraction.category} />
                    <MetaField icon={DollarSign} label="Total"
                      value={formatCurrency(extraction.total, extraction.currency)}
                    />
                  </div>
                </div>

                {/* Line items */}
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

                {/* Re-upload */}
                <div className="flex justify-center pt-1">
                  <Button variant="outline" size="sm" onClick={clearAll} data-testid="button-new-receipt" className="gap-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Analyze Another Receipt
                  </Button>
                </div>
              </div>
            )}

            {/* Analyze button */}
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
      </main>
    </div>
  );
}
