import { useState, useEffect } from 'react';
import { Settings, Trash2, Activity, Globe, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const PREF_CURRENCY_KEY = 'receipt-intelligence:pref-currency';
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NOK'];

interface SettingsTabProps {
  historyCount: number;
  onClearHistory: () => void;
}

type ApiStatus = 'checking' | 'online' | 'offline';

export function SettingsTab({ historyCount, onClearHistory }: SettingsTabProps) {
  const [defaultCurrency, setDefaultCurrency] = useState(
    () => localStorage.getItem(PREF_CURRENCY_KEY) ?? 'USD'
  );
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setApiStatus('checking');
    fetch('/api/health')
      .then(r => { if (!cancelled) setApiStatus(r.ok ? 'online' : 'offline'); })
      .catch(() => { if (!cancelled) setApiStatus('offline'); });
    return () => { cancelled = true; };
  }, []);

  const saveCurrency = (val: string) => {
    setDefaultCurrency(val);
    localStorage.setItem(PREF_CURRENCY_KEY, val);
    toast({ title: 'Preference saved', description: `Default currency set to ${val}` });
  };

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    onClearHistory();
    setConfirmClear(false);
    toast({ title: 'History cleared' });
  };

  const selectCls = `w-full px-3 py-2 text-sm bg-background border border-border/60 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60
    hover:border-border transition-colors text-foreground cursor-pointer`;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Settings className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Settings</h2>
          <p className="text-xs text-muted-foreground">Manage your preferences and data</p>
        </div>
      </div>

      {/* Preferences */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            Preferences
          </h3>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Default Currency
            </label>
            <select
              value={defaultCurrency}
              onChange={e => saveCurrency(e.target.value)}
              className={selectCls}
              data-testid="settings-currency"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Used as fallback when currency cannot be detected.</p>
          </div>
        </CardContent>
      </Card>

      {/* API Status */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            API Status
          </h3>
          <div className="flex items-center gap-3">
            {apiStatus === 'checking' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Checking connection…</span>
              </>
            )}
            {apiStatus === 'online' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-foreground font-medium">API server is online</span>
              </>
            )}
            {apiStatus === 'offline' && (
              <>
                <XCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">API server is unreachable</span>
              </>
            )}
            <button
              onClick={() => {
                setApiStatus('checking');
                fetch('/api/health')
                  .then(r => setApiStatus(r.ok ? 'online' : 'offline'))
                  .catch(() => setApiStatus('offline'));
              }}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
            Data Management
          </h3>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 border border-border/40">
            <div>
              <p className="text-sm font-medium text-foreground">Receipt History</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {historyCount === 0 ? 'No receipts stored' : `${historyCount} receipt${historyCount !== 1 ? 's' : ''} stored locally`}
              </p>
            </div>
            <Button
              variant={confirmClear ? 'destructive' : 'outline'}
              size="sm"
              onClick={handleClear}
              disabled={historyCount === 0}
              className="gap-1.5 shrink-0"
              data-testid="settings-clear-history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmClear ? 'Confirm Clear' : 'Clear All'}
            </Button>
          </div>
          {confirmClear && (
            <p className="text-xs text-destructive animate-in fade-in">
              Click <strong>Confirm Clear</strong> again to permanently delete all history. This cannot be undone.
            </p>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <p className="text-xs text-muted-foreground text-center">
        Receipt Intelligence · Built with Gemini AI · All data stored locally in your browser.
      </p>
    </div>
  );
}
