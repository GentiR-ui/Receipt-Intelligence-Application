import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import type { ReceiptUploadResult } from '@workspace/api-zod';

export default function Home() {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<ReceiptUploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((file: File) => {
    // Validate
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size must be under 10MB');
      setState('error');
      return;
    }
    
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMsg('Only images (JPEG, PNG, WEBP) and PDFs are supported');
      setState('error');
      return;
    }

    setSelectedFile(file);
    setErrorMsg(null);
    setState('idle');

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null); // PDF
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, [handleFileChange]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  }, [handleFileChange]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setState('idle');
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  async function handleUpload() {
    if (!selectedFile) return;

    setState('loading');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const res = await fetch('/api/receipts/upload', { 
        method: 'POST', 
        body: formData 
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      
      const data: ReceiptUploadResult = await res.json();
      setResult(data);
      setState('success');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Upload failed');
      setState('error');
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Complete</span>;
      case 'processing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Processing</span>;
      case 'error':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Error</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold tracking-tight text-foreground">Receipt Intelligence</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Automated extraction for finance teams</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-4xl font-bold tracking-tight mb-3 text-foreground">Stop typing receipts.</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Upload any receipt, invoice, or check. Our engine instantly extracts vendor, total, and line items with high precision.
          </p>
        </div>

        <Card className="border-border/60 shadow-lg shadow-primary/5 transition-all duration-300">
          <CardContent className="p-6 sm:p-10">
            {state === 'success' && result ? (
              <div className="animate-in fade-in zoom-in-95 duration-500" data-testid="container-success">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-semibold text-center mb-2">Upload Complete</h3>
                <p className="text-muted-foreground text-center mb-8">
                  Your receipt has been securely uploaded and is queued for extraction.
                </p>

                <div className="bg-muted/50 rounded-xl p-6 border border-border/40 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">File Name</p>
                      <p className="font-medium text-foreground truncate" title={result.filename}>{result.filename}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Status</p>
                      <div>{renderStatusBadge(result.status)}</div>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Upload ID</p>
                      <p className="font-mono text-xs text-foreground bg-background/50 px-2 py-1 rounded inline-block border border-border/40">{result.id.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Time</p>
                      <p className="font-medium text-foreground">{format(new Date(result.uploadedAt), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border/40">
                    <p className="text-muted-foreground mb-1 text-sm">System Message</p>
                    <p className="text-sm font-medium">{result.message}</p>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <Button onClick={clearSelection} variant="outline" data-testid="button-upload-another">
                    Upload Another Receipt
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div
                  className={`
                    relative rounded-xl border-2 border-dashed transition-colors duration-200 ease-in-out
                    flex flex-col items-center justify-center overflow-hidden
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/50'}
                    ${selectedFile ? 'p-0' : 'p-12'}
                  `}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  data-testid="upload-zone"
                >
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={onFileSelect}
                    ref={fileInputRef}
                    disabled={state === 'loading'}
                    data-testid="input-file"
                  />
                  
                  {selectedFile ? (
                    <div className="w-full relative bg-background">
                      <div className="p-4 flex items-center justify-between border-b border-border/40 relative z-10 bg-background/80 backdrop-blur-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-10 h-10 object-cover rounded-md border border-border" />
                          ) : (
                            <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center text-primary">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full relative z-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            clearSelection();
                          }}
                          disabled={state === 'loading'}
                          data-testid="button-clear-file"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {previewUrl && (
                        <div className="w-full bg-muted/30 aspect-[21/9] sm:aspect-[21/9] flex items-center justify-center overflow-hidden">
                          <img src={previewUrl} alt="Full Preview" className="w-full h-full object-contain opacity-50 blur-sm mix-blend-multiply pointer-events-none absolute" />
                          <img src={previewUrl} alt="Full Preview" className="max-w-full max-h-64 object-contain relative z-10 p-4 shadow-2xl rounded-xl" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center pointer-events-none">
                      <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <p className="text-lg font-medium text-foreground mb-1">
                        Drop your receipt here
                      </p>
                      <p className="text-sm text-muted-foreground max-w-[250px]">
                        JPEG, PNG, WEBP, or PDF up to 10MB
                      </p>
                    </div>
                  )}
                </div>

                {state === 'error' && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive animate-in fade-in" data-testid="alert-error">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium">Upload failed</h4>
                      <p className="text-sm opacity-90">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center">
                  <Button 
                    className="w-full sm:w-auto min-w-[200px] h-12 text-base font-medium shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all" 
                    onClick={handleUpload}
                    disabled={!selectedFile || state === 'loading'}
                    data-testid="button-analyze"
                  >
                    {state === 'loading' ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Receipt'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
