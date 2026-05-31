import {
  Clock, Receipt, Download, Trash2, Eye, TrendingUp, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReceiptExtraction, HistoryEntry } from '@/lib/types';

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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface HistoryTabProps {
  history: HistoryEntry[];
  onViewDetails: (entry: HistoryEntry) => void;
  onExport: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryTab({
  history, onViewDetails, onExport, onDelete, onClearAll,
}: HistoryTabProps) {
  const totalSpend = history.reduce((sum, e) => sum + (e.extraction.total ?? 0), 0);
  const avgSpend = history.length > 0 ? totalSpend / history.length : 0;

  if (history.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div
          className="flex flex-col items-center text-center py-20 px-6 rounded-2xl border border-dashed border-border/50 bg-muted/20"
          data-testid="history-empty"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center text-primary/40 mb-4 ring-1 ring-primary/10">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-foreground mb-2">No receipts analyzed yet</p>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Once you analyze a receipt on the Dashboard it will appear here. Your history is saved locally — no account needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6" data-testid="history-panel">

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Receipts', value: history.length.toString(), icon: FileText },
          { label: 'Total Spend', value: formatCurrency(totalSpend, 'USD'), icon: TrendingUp },
          { label: 'Avg per Receipt', value: formatCurrency(avgSpend, 'USD'), icon: Receipt },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          Receipt History
          <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {history.length}
          </span>
        </h3>
        <button
          onClick={onClearAll}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          data-testid="button-clear-history"
        >
          Clear all
        </button>
      </div>

      {/* Data table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Receipt</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground">Vendor</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Date</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Analyzed</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {history.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-muted/20 transition-colors group"
                  data-testid={`history-row-${entry.id}`}
                >
                  {/* Receipt */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[100px]" title={entry.filename}>
                        {entry.filename}
                      </p>
                    </div>
                  </td>

                  {/* Vendor */}
                  <td className="px-3 py-3">
                    <span className="text-sm font-medium text-foreground">
                      {entry.extraction.vendor ?? <span className="text-muted-foreground">—</span>}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {entry.extraction.date ? formatDate(entry.extraction.date) : '—'}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3 hidden lg:table-cell">
                    {entry.extraction.category ? (
                      <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {entry.extraction.category}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatCurrency(entry.extraction.total, entry.extraction.currency)}
                    </span>
                  </td>

                  {/* Analyzed */}
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(entry.analyzedAt)}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => onViewDetails(entry)}
                        className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        data-testid={`button-view-${entry.id}`}
                      >
                        <Eye className="w-3 h-3" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <button
                        onClick={() => onExport(entry)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Export CSV"
                        data-testid={`button-export-history-${entry.id}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(entry.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                        data-testid={`button-delete-history-${entry.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
