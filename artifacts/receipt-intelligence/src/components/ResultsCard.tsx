import { useState, useEffect } from 'react';
import {
  Sparkles, Download, RotateCcw, Receipt, ShoppingCart,
  Plus, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ReceiptExtraction, ReceiptLineItem } from '@/lib/types';

const CATEGORIES = [
  'Food & Dining', 'Groceries', 'Transportation', 'Accommodation',
  'Shopping', 'Healthcare', 'Entertainment', 'Utilities', 'Other',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NOK'];

function formatCurrency(amount: number | null, currency: string | null): string {
  if (amount === null) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: currency ?? 'USD', minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency ?? ''} ${amount.toFixed(2)}`.trim();
  }
}

interface EditableField {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: EditableField) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = `w-full px-3 py-1.5 text-sm bg-background border border-border/60 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60
  hover:border-border transition-colors text-foreground placeholder:text-muted-foreground/50`;

const selectCls = `${inputCls} cursor-pointer`;

interface ResultsCardProps {
  extraction: ReceiptExtraction | null;
  filename?: string;
  onExportCsv: (data: ReceiptExtraction) => void;
  onNewReceipt: () => void;
}

export function ResultsCard({ extraction, filename, onExportCsv, onNewReceipt }: ResultsCardProps) {
  const [edited, setEdited] = useState<ReceiptExtraction | null>(null);
  const [taxPct, setTaxPct] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  // Sync when extraction changes
  useEffect(() => {
    if (extraction) {
      setEdited(JSON.parse(JSON.stringify(extraction)));
      setTaxPct(0);
      setSaved(false);
    } else {
      setEdited(null);
    }
  }, [extraction]);

  if (!extraction || !edited) {
    return (
      <Card className="border-border/60 shadow-sm h-full">
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-72 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/40">
            <Receipt className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">No receipt analyzed yet</p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Upload a receipt on the left and click <strong>Analyze Receipt</strong> — Gemini AI will extract all the data automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Computed values
  const itemsSubtotal = edited.items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1), 0);
  const taxAmount = itemsSubtotal * (taxPct / 100);
  const computedTotal = itemsSubtotal + taxAmount;

  const setField = <K extends keyof ReceiptExtraction>(key: K, value: ReceiptExtraction[K]) => {
    setEdited(prev => prev ? { ...prev, [key]: value } : prev);
    setSaved(false);
  };

  const setItem = (idx: number, field: keyof ReceiptLineItem, value: string) => {
    setEdited(prev => {
      if (!prev) return prev;
      const items = [...prev.items];
      const parsed = field === 'name' ? value : (value === '' ? null : parseFloat(value));
      items[idx] = { ...items[idx], [field]: parsed };
      return { ...prev, items };
    });
    setSaved(false);
  };

  const addItem = () => {
    setEdited(prev => prev ? { ...prev, items: [...prev.items, { name: '', quantity: 1, price: null }] } : prev);
    setSaved(false);
  };

  const removeItem = (idx: number) => {
    setEdited(prev => prev ? { ...prev, items: prev.items.filter((_, i) => i !== idx) } : prev);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Card className="border-border/60 shadow-sm" data-testid="extraction-results">
      <CardContent className="p-5 sm:p-6 space-y-5">

        {/* Card header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Extracted Data</h3>
            {filename && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{filename}</p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Sparkles className="w-3 h-3" />
            Gemini AI
          </span>
        </div>

        {/* Meta fields — editable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Vendor">
            <input
              type="text"
              value={edited.vendor ?? ''}
              onChange={e => setField('vendor', e.target.value || null)}
              placeholder="Vendor name"
              className={inputCls}
              data-testid="field-vendor"
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={edited.date ?? ''}
              onChange={e => setField('date', e.target.value || null)}
              className={inputCls}
              data-testid="field-date"
            />
          </Field>
          <Field label="Category">
            <select
              value={edited.category ?? ''}
              onChange={e => setField('category', e.target.value || null)}
              className={selectCls}
              data-testid="field-category"
            >
              <option value="">— Select category —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Currency">
            <select
              value={edited.currency ?? ''}
              onChange={e => setField('currency', e.target.value || null)}
              className={selectCls}
              data-testid="field-currency"
            >
              <option value="">— Select currency —</option>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        {/* AI Insights */}
        {edited.insights && edited.insights.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4" data-testid="ai-insights">
            <h4 className="text-xs font-semibold text-primary uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Insights
            </h4>
            <ul className="space-y-1.5">
              {edited.insights.map((insight, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                  <span className="text-primary mt-1 shrink-0">›</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Line Items — editable table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <ShoppingCart className="w-3.5 h-3.5" />
              Line Items
              <span className="ml-1 font-normal normal-case text-xs bg-muted px-2 py-0.5 rounded-full">
                {edited.items.length} item{edited.items.length !== 1 ? 's' : ''}
              </span>
            </h4>
            <button
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              data-testid="button-add-item"
            >
              <Plus className="w-3.5 h-3.5" />
              Add row
            </button>
          </div>

          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm" data-testid="table-line-items">
              <thead>
                <tr className="bg-muted/50 border-b border-border/40">
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Item</th>
                  <th className="text-center px-2 py-2.5 text-xs font-medium text-muted-foreground w-16">Qty</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground w-24">Price</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {edited.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground">
                      No line items — click <strong>Add row</strong> to add one.
                    </td>
                  </tr>
                ) : edited.items.map((item, i) => (
                  <tr key={i} className="group" data-testid={`row-item-${i}`}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.name ?? ''}
                        onChange={e => setItem(i, 'name', e.target.value)}
                        placeholder="Item description"
                        className="w-full px-0 py-0.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/40"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={item.quantity ?? ''}
                        onChange={e => setItem(i, 'quantity', e.target.value)}
                        placeholder="—"
                        min={0}
                        className="w-full px-0 py-0.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 text-center text-muted-foreground tabular-nums"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.price ?? ''}
                        onChange={e => setItem(i, 'price', e.target.value)}
                        placeholder="—"
                        step="0.01"
                        min={0}
                        className="w-full px-0 py-0.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 text-right font-medium text-foreground tabular-nums"
                      />
                    </td>
                    <td className="pr-2 py-2">
                      <button
                        onClick={() => removeItem(i)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        data-testid={`button-delete-item-${i}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Summary footer */}
              <tfoot className="border-t border-border/60 bg-muted/30">
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-xs text-muted-foreground">Subtotal</td>
                  <td className="px-3 py-2 text-right text-xs font-medium tabular-nums text-foreground">
                    {formatCurrency(itemsSubtotal, edited.currency)}
                  </td>
                  <td />
                </tr>
                <tr>
                  <td className="px-3 py-2 text-xs text-muted-foreground">Tax</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={taxPct}
                        onChange={e => setTaxPct(parseFloat(e.target.value) || 0)}
                        min={0}
                        max={100}
                        step={0.5}
                        className="w-12 px-1 py-0.5 text-xs bg-background border border-border/60 rounded text-center focus:outline-none focus:ring-1 focus:ring-primary/40 tabular-nums"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-medium tabular-nums text-foreground">
                    {formatCurrency(taxAmount, edited.currency)}
                  </td>
                  <td />
                </tr>
                <tr className="border-t border-border/40">
                  <td colSpan={2} className="px-3 py-2.5 text-sm font-semibold text-foreground">Total</td>
                  <td className="px-3 py-2.5 text-right text-sm font-bold text-foreground tabular-nums">
                    {formatCurrency(computedTotal, edited.currency)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-border/30">
          <Button
            variant="ghost" size="sm"
            onClick={onNewReceipt}
            data-testid="button-new-receipt"
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Analyze Another
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={() => onExportCsv(edited)}
            data-testid="button-export-csv"
            className="gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            data-testid="button-save"
            className={`gap-1.5 transition-all ${saved ? 'bg-green-600 hover:bg-green-600 text-white' : ''}`}
          >
            {saved ? '✓ Saved' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
