import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { NavBar, type TabId } from '@/components/NavBar';
import { DropZone, type UploadState } from '@/components/DropZone';
import { ResultsCard } from '@/components/ResultsCard';
import { HistoryTab } from '@/components/HistoryTab';
import { SettingsTab } from '@/components/SettingsTab';
import type { ReceiptExtraction, HistoryEntry } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────
const HISTORY_KEY = 'receipt-intelligence:history';
const MAX_HISTORY = 20;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;

// ─── Persistence helpers ─────────────────────────────────────────────────────
function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'); }
  catch { return []; }
}
function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

// ─── CSV helpers ─────────────────────────────────────────────────────────────
function buildCsv(data: ReceiptExtraction): string {
  const esc = (v: string | number | null) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    'Section,Field,Value',
    `Metadata,Vendor,${esc(data.vendor)}`,
    `Metadata,Date,${esc(data.date)}`,
    `Metadata,Category,${esc(data.category)}`,
    `Metadata,Currency,${esc(data.currency)}`,
    `Metadata,Total,${esc(data.total)}`,
    '',
    'Line Items,Item Name,Quantity,Price',
    ...data.items.map(item => `Line Items,${esc(item.name)},${esc(item.quantity)},${esc(item.price)}`),
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

// ─── Component ───────────────────────────────────────────────────────────────
export default function Home() {
  // Tab navigation
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [extraction, setExtraction] = useState<ReceiptExtraction | null>(null);
  const [activeFilename, setActiveFilename] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processingStepIdx, setProcessingStepIdx] = useState(0);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveHistory(history); }, [history]);

  // Cycle processing steps during loading
  useEffect(() => {
    if (uploadState !== 'loading') { setProcessingStepIdx(0); return; }
    setProcessingStepIdx(0);
    const timers = [
      setTimeout(() => setProcessingStepIdx(1), 1500),
      setTimeout(() => setProcessingStepIdx(2), 3500),
      setTimeout(() => setProcessingStepIdx(3), 5500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [uploadState]);

  // ── File handling ────────────────────────────────────────────────────────
  const applyFile = useCallback((file: File) => {
    if (file.size > MAX_SIZE) {
      setErrorMsg('File must be under 10MB.');
      setUploadState('error');
      toast({ title: 'File too large', description: 'Maximum file size is 10MB.', variant: 'destructive' });
      return;
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      setErrorMsg('Only JPEG, PNG, WEBP, and PDF files are supported.');
      setUploadState('error');
      toast({ title: 'Unsupported file type', description: 'Please upload a JPEG, PNG, WEBP, or PDF.', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
    setErrorMsg(null);
    setIsDuplicate(false);
    setIsNetworkError(false);
    setUploadState('idle');
    setExtraction(null);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadState('idle');
    setErrorMsg(null);
    setIsDuplicate(false);
    setIsNetworkError(false);
    setExtraction(null);
    setActiveFilename('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.[0]) applyFile(e.dataTransfer.files[0]);
  }, [applyFile]);
  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) applyFile(e.target.files[0]);
  }, [applyFile]);

  // ── Analysis ─────────────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!selectedFile) return;
    setUploadState('loading');
    setErrorMsg(null);
    setIsDuplicate(false);
    setIsNetworkError(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      let res: Response;
      try {
        res = await fetch('/api/extract', { method: 'POST', body: formData });
      } catch {
        setIsNetworkError(true);
        setErrorMsg('Cannot reach the server. Check your connection and try again.');
        setUploadState('error');
        toast({ title: 'Network error', description: 'Could not connect to the server.', variant: 'destructive' });
        return;
      }

      if (res.status === 409) {
        const err = await res.json().catch(() => ({ error: 'Duplicate detected' }));
        const msg = err.error ?? 'This receipt appears to have already been processed.';
        setErrorMsg(msg);
        setIsDuplicate(true);
        setUploadState('error');
        toast({ title: 'Potential Duplicate Detected', description: msg });
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error ?? 'Extraction failed');
      }

      const data: ReceiptExtraction = await res.json();
      setExtraction(data);
      setActiveFilename(selectedFile.name);
      setUploadState('success');
      toast({ title: 'Receipt analyzed ✓', description: `Extracted data from ${selectedFile.name}` });

      setHistory(prev => [{
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        filename: selectedFile.name,
        analyzedAt: new Date().toISOString(),
        extraction: data,
      }, ...prev]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Extraction failed';
      setErrorMsg(msg);
      setUploadState('error');
      toast({ title: 'Extraction failed', description: msg, variant: 'destructive' });
    }
  }

  // ── History actions ───────────────────────────────────────────────────────
  function openHistoryEntry(entry: HistoryEntry) {
    clearAll();
    setExtraction(entry.extraction);
    setActiveFilename(entry.filename);
    setUploadState('success');
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteHistoryEntry(id: string) {
    setHistory(prev => prev.filter(h => h.id !== id));
  }

  function exportEntry(entry: HistoryEntry) {
    triggerDownload(buildCsv(entry.extraction), entry.extraction.vendor);
    toast({ title: 'CSV downloaded' });
  }

  function exportCurrent(data: ReceiptExtraction) {
    triggerDownload(buildCsv(data), data.vendor);
    toast({ title: 'CSV downloaded' });
  }

  // ── Nav: "New Receipt" CTA jumps to dashboard & clears ───────────────────
  function handleUploadClick() {
    clearAll();
    setActiveTab('dashboard');
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUploadClick={handleUploadClick}
      />

      <main className="flex-1">
        {/* ── Dashboard Tab ─────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-7xl mx-auto px-4 sm:px-6 mt-6 pb-12">
            {/* Hero tagline — full width above split */}
            <div className="col-span-full mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Stop typing receipts.
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Upload any receipt or invoice — Gemini Vision extracts vendor, totals, and line items instantly.
              </p>
            </div>

            {/* Left column — dropzone */}
            <div className="lg:col-span-4">
              <DropZone
                uploadState={uploadState}
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                isDragging={isDragging}
                errorMsg={errorMsg}
                isDuplicate={isDuplicate}
                isNetworkError={isNetworkError}
                processingStepIdx={processingStepIdx}
                fileInputRef={fileInputRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onFileSelect={onFileSelect}
                onClear={clearAll}
                onAnalyze={handleAnalyze}
              />
            </div>

            {/* Right column — results */}
            <div className="lg:col-span-8">
              <ResultsCard
                extraction={extraction}
                filename={activeFilename}
                onExportCsv={exportCurrent}
                onNewReceipt={clearAll}
              />
            </div>
          </div>
        )}

        {/* ── History Tab ───────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <HistoryTab
            history={history}
            onViewDetails={openHistoryEntry}
            onExport={exportEntry}
            onDelete={deleteHistoryEntry}
            onClearAll={() => setHistory([])}
          />
        )}

        {/* ── Settings Tab ──────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <SettingsTab
            historyCount={history.length}
            onClearHistory={() => setHistory([])}
          />
        )}
      </main>
    </div>
  );
}
