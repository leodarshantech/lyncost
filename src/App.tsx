import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { TransactionModal } from './components/TransactionModal';
import { CommandPalette } from './components/CommandPalette';
import { UpdateBanner } from './components/UpdateBanner';
import { PinScreen } from './components/PinScreen';
import { SetupWizard } from './components/SetupWizard';
import { LicenseActivationScreen } from './components/LicenseActivationScreen';
import { RefreshCw, Coins, ShieldCheck, AlertTriangle } from 'lucide-react';
import './App.css';

// Pages other than the dashboard load on first visit to keep startup fast
const AccountsPage = React.lazy(() => import('./pages/AccountsPage').then((m) => ({ default: m.AccountsPage })));
const TransactionsPage = React.lazy(() => import('./pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })));
const CategoriesPage = React.lazy(() => import('./pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const RecurringRulesPage = React.lazy(() => import('./pages/RecurringRulesPage').then((m) => ({ default: m.RecurringRulesPage })));
const GoalsPage = React.lazy(() => import('./pages/GoalsPage').then((m) => ({ default: m.GoalsPage })));
const BillsPage = React.lazy(() => import('./pages/BillsPage').then((m) => ({ default: m.BillsPage })));
const ShoppingListPage = React.lazy(() => import('./pages/ShoppingListPage').then((m) => ({ default: m.ShoppingListPage })));
const WarrantiesPage = React.lazy(() => import('./pages/WarrantiesPage').then((m) => ({ default: m.WarrantiesPage })));
const CsvImportPage = React.lazy(() => import('./pages/CsvImportPage').then((m) => ({ default: m.CsvImportPage })));
const InvestmentsPage = React.lazy(() => import('./pages/InvestmentsPage').then((m) => ({ default: m.InvestmentsPage })));
const DebtsPage = React.lazy(() => import('./pages/DebtsPage').then((m) => ({ default: m.DebtsPage })));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const CalculatorsPage = React.lazy(() => import('./pages/CalculatorsPage').then((m) => ({ default: m.CalculatorsPage })));
const BudgetsPage = React.lazy(() => import('./pages/BudgetsPage').then((m) => ({ default: m.BudgetsPage })));

export const App: React.FC = () => {
  const isLoading = useAppStore(state => state.isLoading);
  const startupError = useAppStore(state => state.startupError);
  const isUnlocked = useAppStore(state => state.isUnlocked);
  const lockApp = useAppStore(state => state.lockApp);
  const settings = useAppStore(state => state.settings);
  const accounts = useAppStore(state => state.accounts);
  const activeTab = useAppStore(state => state.activeTab);
  const initApp = useAppStore(state => state.initApp);
  const loadTransactions = useAppStore(state => state.loadTransactions);
  const loadMonthSummary = useAppStore(state => state.loadMonthSummary);
  const loadAccounts = useAppStore(state => state.loadAccounts);
  const loadNetWorthSummary = useAppStore(state => state.loadNetWorthSummary);

  const theme = useAppStore(state => state.theme);

  // Detect Windows vs Linux (or ?license_test=1 for developer preview).
  // Match the explicit "Windows" token; a loose /win/i also matches unrelated strings.
  const isLicenseTest = typeof window !== 'undefined' && window.location.search.includes('license_test');
  const isWindowsPlatform = typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent || '');
  const isWindows = isWindowsPlatform || isLicenseTest;
  const [isLicenseActivated, setIsLicenseActivated] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (isLicenseTest) return false;
    // On Linux / non-Windows, Lyncost is free
    if (!isWindowsPlatform) return true;
    try {
      return localStorage.getItem('lyncost_license_activated') === 'true';
    } catch {
      return false;
    }
  });

  const [isQuickTxnOpen, setIsQuickTxnOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = React.useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = React.useState(false);

  useEffect(() => {
    initApp();
  }, [initApp]);

  useEffect(() => {
    if (!isLoading && isUnlocked) {
      const hasCompleted = localStorage.getItem('lyncost_wizard_completed') === 'true';
      if (!hasCompleted && accounts.length === 0) {
        setIsSetupWizardOpen(true);
      }
    }
  }, [isLoading, isUnlocked, accounts.length]);

  useEffect(() => {
    const handleOpenWizard = () => setIsSetupWizardOpen(true);
    window.addEventListener('open_lyncost_wizard', handleOpenWizard);
    return () => window.removeEventListener('open_lyncost_wizard', handleOpenWizard);
  }, []);

  // Security: Inactivity Auto-Lock system
  useEffect(() => {
    if (!isUnlocked || !settings?.has_pin) return;

    const rawMinutes = localStorage.getItem('lyncost_autolock_minutes');
    // Default: 5 minutes if PIN is enabled, 0 = disabled
    const minutes = rawMinutes !== null ? parseInt(rawMinutes, 10) : 5;
    if (minutes <= 0 || isNaN(minutes)) return;

    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setIsQuickTxnOpen(false);
        setIsCommandPaletteOpen(false);
        lockApp();
      }, minutes * 60 * 1000);
    };

    resetTimer();

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isUnlocked, settings?.has_pin, lockApp]);

  // Security: Window Blur Privacy Shield (optional shoulder-surfing protection)
  useEffect(() => {
    const handleBlur = () => {
      if (localStorage.getItem('lyncost_blur_on_unfocus') === 'true' && isUnlocked) {
        setIsWindowBlurred(true);
      }
    };
    const handleFocus = () => {
      setIsWindowBlurred(false);
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isUnlocked]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger global shortcuts if setup wizard is open or Windows license activation is pending
      if (isSetupWizardOpen || (isWindows && !isLicenseActivated)) {
        return;
      }
      // Ctrl+L or Cmd+L locks app immediately if PIN is configured
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        if (settings?.has_pin) {
          e.preventDefault();
          setIsQuickTxnOpen(false);
          setIsCommandPaletteOpen(false);
          lockApp();
          return;
        }
      }
      // Ctrl+K or Cmd+K opens Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Ctrl+N or Cmd+N opens New Transaction
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsQuickTxnOpen(true);
      }
      // Escape closes open modals
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        if (isQuickTxnOpen) setIsQuickTxnOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickTxnOpen, isCommandPaletteOpen, isSetupWizardOpen, isWindows, isLicenseActivated, settings?.has_pin, lockApp]);

  const handleQuickTxnSaved = React.useCallback(async () => {
    await Promise.all([
      loadTransactions(),
      loadMonthSummary(),
      loadAccounts(false),
      loadNetWorthSummary(),
    ]);
  }, [loadTransactions, loadMonthSummary, loadAccounts, loadNetWorthSummary]);

  // On Windows (or during developer preview), gate access behind license activation immediately
  if (isWindows && !isLicenseActivated) {
    return (
      <LicenseActivationScreen
        onActivated={() => {
          setIsLicenseActivated(true);
          setIsQuickTxnOpen(false);
          setIsCommandPaletteOpen(false);
          if (typeof document !== 'undefined') {
            (document.activeElement as HTMLElement)?.blur();
          }
          setIsSetupWizardOpen(true);
        }}
      />
    );
  }

  if (startupError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-lg w-full rounded-2xl bg-zinc-900 border border-rose-900/60 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/70 border border-rose-900 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold">Lyncost could not open your database</h1>
          </div>
          <p className="text-sm text-zinc-300">
            Your data has not been modified. Close Lyncost and try again. If this keeps happening, restore a backup
            from the <span className="font-mono">backups</span> folder next to your database, or report the error below.
          </p>
          <pre className="text-xs text-rose-300 bg-zinc-950 border border-zinc-800 rounded-lg p-3 whitespace-pre-wrap break-words select-text">
            {startupError}
          </pre>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white select-none">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4 text-purple-400 shadow-xl shadow-purple-950/40">
          <Coins className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
          <span>Starting Lyncost...</span>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return <PinScreen />;
  }

  return (
    <div className={`h-screen w-screen overflow-hidden flex transition-colors duration-200 ${
      theme === 'light' ? 'theme-light bg-[#f8fafc] text-zinc-950' : 'theme-dark bg-zinc-950 text-zinc-100'
    }`}>
      <Sidebar
        onOpenQuickTransaction={() => setIsQuickTxnOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
      <main className="flex-1 h-full overflow-y-auto p-6 sm:p-8 max-w-7xl custom-scrollbar">
        <UpdateBanner />
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center py-24 text-zinc-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
          }
        >
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'accounts' && <AccountsPage />}
          {activeTab === 'transactions' && <TransactionsPage />}
          {activeTab === 'categories' && <CategoriesPage />}
          {activeTab === 'recurring' && <RecurringRulesPage />}
          {activeTab === 'goals' && <GoalsPage />}
          {activeTab === 'budgets' && <BudgetsPage />}
          {activeTab === 'bills' && <BillsPage />}
          {activeTab === 'shopping' && <ShoppingListPage />}
          {activeTab === 'warranties' && <WarrantiesPage />}
          {activeTab === 'csv_import' && <CsvImportPage />}
          {activeTab === 'investments' && <InvestmentsPage />}
          {activeTab === 'debts' && <DebtsPage />}
          {activeTab === 'calculators' && <CalculatorsPage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </React.Suspense>
      </main>

      {/* Global Quick Transaction Modal accessible via Ctrl+N or Sidebar button */}
      <TransactionModal
        isOpen={isQuickTxnOpen}
        onClose={() => setIsQuickTxnOpen(false)}
        onSaved={handleQuickTxnSaved}
      />

      {/* Universal Command Palette accessible via Ctrl+K or Sidebar button */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenNewTransaction={() => setIsQuickTxnOpen(true)}
      />

      {/* Initial Setup Wizard */}
      <SetupWizard
        isOpen={isSetupWizardOpen}
        onClose={() => {
          setIsSetupWizardOpen(false);
          setIsQuickTxnOpen(false);
          setIsCommandPaletteOpen(false);
          if (typeof document !== 'undefined') {
            (document.activeElement as HTMLElement)?.blur();
          }
        }}
        onCompleted={() => {
          setIsSetupWizardOpen(false);
          setIsQuickTxnOpen(false);
          setIsCommandPaletteOpen(false);
          if (typeof document !== 'undefined') {
            (document.activeElement as HTMLElement)?.blur();
          }
          localStorage.setItem('lyncost_wizard_completed', 'true');
        }}
      />

      {/* Privacy Shield Overlay when window unfocused */}
      {isWindowBlurred && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/40 flex items-center justify-center pointer-events-none select-none">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/90 border border-purple-500/30 text-white text-xs font-bold shadow-2xl">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Privacy Shield Active (Window Unfocused)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
