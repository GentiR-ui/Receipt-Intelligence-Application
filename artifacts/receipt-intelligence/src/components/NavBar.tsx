import { FileText, LayoutDashboard, Upload, Clock, Settings } from 'lucide-react';

export type TabId = 'dashboard' | 'history' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'history',   label: 'History',   icon: Clock },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

interface NavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onUploadClick: () => void;
}

export function NavBar({ activeTab, onTabChange, onUploadClick }: NavBarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0 mr-4">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold tracking-tight text-foreground text-sm">
            Receipt Intelligence
          </span>
        </div>

        {/* Tab nav */}
        <nav className="flex items-center gap-1 flex-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              data-testid={`nav-tab-${id}`}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors
                ${activeTab === id
                  ? 'text-primary bg-primary/8'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
              {activeTab === id && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Upload CTA */}
        <button
          onClick={onUploadClick}
          data-testid="nav-upload-cta"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-sm"
        >
          <Upload className="w-3 h-3" />
          New Receipt
        </button>
      </div>
    </header>
  );
}
