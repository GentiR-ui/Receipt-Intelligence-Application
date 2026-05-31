import { useRef } from 'react';
import {
  UploadCloud, FileText, X, Loader2, AlertCircle, AlertTriangle,
  WifiOff, CheckCircle2, Scan, ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export type UploadState = 'idle' | 'loading' | 'success' | 'error';

const PROCESSING_STEPS = [
  { label: 'Uploading image…',          icon: UploadCloud },
  { label: 'Reading with Gemini Vision…', icon: Scan },
  { label: 'Extracting line items…',    icon: ShoppingCart },
  { label: 'Finalizing results…',       icon: CheckCircle2 },
];

interface DropZoneProps {
  uploadState: UploadState;
  selectedFile: File | null;
  previewUrl: string | null;
  isDragging: boolean;
  errorMsg: string | null;
  isDuplicate: boolean;
  isNetworkError: boolean;
  processingStepIdx: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onAnalyze: () => void;
}

export function DropZone({
  uploadState, selectedFile, previewUrl, isDragging,
  errorMsg, isDuplicate, isNetworkError, processingStepIdx,
  fileInputRef, onDragOver, onDragLeave, onDrop, onFileSelect,
  onClear, onAnalyze,
}: DropZoneProps) {
  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {uploadState !== 'success' && (
        <div
          className={`relative rounded-xl border-2 border-dashed transition-colors duration-200 overflow-hidden
            ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
            ${selectedFile ? 'p-0' : 'p-8'}`}
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
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClear(); }}
                  disabled={uploadState === 'loading'}
                  data-testid="button-clear"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
              {previewUrl && (
                <div className="w-full bg-muted/20 flex items-center justify-center overflow-hidden max-h-48">
                  <img src={previewUrl} alt="Receipt preview" className="max-h-48 object-contain p-3" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center pointer-events-none">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-primary ring-1 ring-primary/20">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Drop your receipt here</p>
              <p className="text-xs text-muted-foreground mb-3">JPEG, PNG, WEBP, or PDF — up to 10MB</p>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-muted/60 px-3 py-1 rounded-full">
                <Sparkles className="w-3 h-3 text-primary/50" />
                Powered by Gemini Vision
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {uploadState === 'error' && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border animate-in slide-in-from-top-2 fade-in duration-300
            ${isDuplicate
              ? 'bg-amber-500/8 border-amber-500/25 text-amber-700 dark:text-amber-400'
              : isNetworkError
                ? 'bg-blue-500/8 border-blue-500/25 text-blue-700 dark:text-blue-400'
                : 'bg-destructive/8 border-destructive/20 text-destructive'
            }`}
          data-testid="alert-error"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
            ${isDuplicate ? 'bg-amber-500/15' : isNetworkError ? 'bg-blue-500/15' : 'bg-destructive/15'}`}>
            {isDuplicate
              ? <AlertTriangle className="w-4 h-4" />
              : isNetworkError
                ? <WifiOff className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {isDuplicate ? 'Possible Duplicate' : isNetworkError ? 'Connection Error' : 'Extraction Failed'}
            </p>
            <p className="text-xs opacity-75 mt-0.5 leading-relaxed">{errorMsg}</p>
            {isDuplicate && (
              <p className="text-xs opacity-60 mt-1">You can still proceed if this is intentional — clear and re-upload.</p>
            )}
          </div>
          {!isDuplicate && selectedFile && (
            <button
              onClick={onAnalyze}
              className="text-xs font-semibold shrink-0 px-2.5 py-1 rounded-md border border-current/20 hover:bg-current/10 transition-colors"
              data-testid="button-retry"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Loading skeleton + step progress */}
      {uploadState === 'loading' && (
        <div className="space-y-4" data-testid="loading-skeleton">
          <div className="rounded-xl border border-border/40 bg-muted/30 p-4" data-testid="processing-log">
            <div className="flex items-center gap-2 mb-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
              <p className="text-sm font-medium text-foreground">
                {PROCESSING_STEPS[processingStepIdx].label}
              </p>
            </div>
            <div className="flex gap-1.5">
              {PROCESSING_STEPS.map((step, i) => {
                const isDone = i < processingStepIdx;
                const isActive = i === processingStepIdx;
                return (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full transition-all duration-500
                      ${isDone ? 'bg-primary' : isActive ? 'bg-primary/50' : 'bg-border'}`}
                    title={step.label}
                  />
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Step {processingStepIdx + 1} of {PROCESSING_STEPS.length}
            </p>
          </div>
          <div className="animate-pulse space-y-2.5">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-lg" />)}
            </div>
            <div className="h-4 bg-muted rounded w-1/4 mt-1" />
            <div className="space-y-2">
              <div className="h-7 bg-muted rounded" />
              <div className="h-7 bg-muted rounded w-5/6" />
              <div className="h-7 bg-muted rounded w-4/6" />
            </div>
          </div>
        </div>
      )}

      {/* Analyze button */}
      {uploadState !== 'success' && (
        <Button
          className="w-full h-10 text-sm font-semibold shadow-sm shadow-primary/20 hover:shadow-primary/30 transition-all"
          onClick={onAnalyze}
          disabled={!selectedFile || uploadState === 'loading'}
          data-testid="button-analyze"
        >
          {uploadState === 'loading'
            ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" />Extracting...</>
            : 'Analyze Receipt'
          }
        </Button>
      )}

      {/* Success: show preview below dropzone */}
      {uploadState === 'success' && previewUrl && (
        <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
          <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground truncate flex-1">Receipt preview</p>
          </div>
          <div className="bg-muted/20 flex items-center justify-center max-h-52 overflow-hidden">
            <img src={previewUrl} alt="Receipt" className="max-h-52 object-contain p-3" />
          </div>
        </div>
      )}
    </div>
  );
}
