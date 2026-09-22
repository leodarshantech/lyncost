import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { AccountsPage } from './pages/AccountsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { RecurringRulesPage } from './pages/RecurringRulesPage';
import { GoalsPage } from './pages/GoalsPage';
import { BillsPage } from './pages/BillsPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { WarrantiesPage } from './pages/WarrantiesPage';
import { CsvImportPage } from './pages/CsvImportPage';
import { InvestmentsPage } from './pages/InvestmentsPage';
import { DebtsPage } from './pages/DebtsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CalculatorsPage } from './pages/CalculatorsPage';
import { TransactionModal } from './components/TransactionModal';
import { CommandPalette } from './components/CommandPalette';
import { UpdateBanner } from './components/UpdateBanner';
import { PinScreen } from './components/PinScreen';
import { SetupWizard } from './components/SetupWizard';
import { LicenseActivationScreen } from './components/LicenseActivationScreen';
import { RefreshCw, Coins } from 'lucide-react';
import './App.css';

export const App: React.FC = () => {
  const isLoading = useAppStore(state => state.isLoading);
  const isUnlocked = useAppStore(state => state.isUnlocked);
  const accounts = useAppStore(state => state.accounts);
  const activeTab = useAppStore(state => state.activeTab);
  const initApp = useAppStore(state => state.initApp);
  const loadTransactions = useAppStore(state => state.loadTransactions);
  const loadMonthSummary = useAppStore(state => state.loadMonthSummary);
  const loadAccounts = useAppStore(state => state.loadAccounts);
  const loadNetWorthSummary = useAppStore(state => state.loadNetWorthSummary);

  const theme = useAppStore(state => state.theme);

  // Detect Windows vs Linux (or ?license_test=1 for developer preview)
  const isLicenseTest = typeof window !== 'undefined' && window.location.search.includes('license_test');
  const isWindows = typeof window !== 'undefined' && (/win/i.test(navigator.userAgent || navigator.platform) || isLicenseTest);
  const [isLicenseActivated, setIsLicenseActivated] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (isLicenseTest) return false;
    // On Linux / non-Windows, Lyncost is free
    if (!/win/i.test(navigator.userAgent || navigator.platform)) {
      return true;
    }
    return localStorage.getItem('lyncost_license_activated') === 'true';
  });

  const [isQuickTxnOpen, setIsQuickTxnOpen] = React.useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = React.useState(false);

  // Developer preview hook (allows testing activation screen anytime via console)
  useEffect(() => {
    const handleTest = () => setIsLicenseActivated(false);
    window.addEventListener('test_license_screen', handleTest);
    return () => window.removeEventListener('test_license_screen', handleTest);
  }, []);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger global shortcuts if setup wizard is open or Windows license activation is pending
      if (isSetupWizardOpen || (isWindows && !isLicenseActivated)) {
        return;
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
  }, [isQuickTxnOpen, isCommandPaletteOpen, isSetupWizardOpen, isWindows, isLicenseActivated]);

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
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'accounts' && <AccountsPage />}
        {activeTab === 'transactions' && <TransactionsPage />}
        {activeTab === 'categories' && <CategoriesPage />}
        {activeTab === 'recurring' && <RecurringRulesPage />}
        {activeTab === 'goals' && <GoalsPage />}
        {activeTab === 'bills' && <BillsPage />}
        {activeTab === 'shopping' && <ShoppingListPage />}
        {activeTab === 'warranties' && <WarrantiesPage />}
        {activeTab === 'csv_import' && <CsvImportPage />}
        {activeTab === 'investments' && <InvestmentsPage />}
        {activeTab === 'debts' && <DebtsPage />}
        {activeTab === 'calculators' && <CalculatorsPage />}
        {activeTab === 'reports' && <ReportsPage />}
        {activeTab === 'settings' && <SettingsPage />}
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
    </div>
  );
};

export default App;
