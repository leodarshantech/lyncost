import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { POPULAR_CURRENCIES, setNumberFormatSystem, autoSyncNumberFormatWithCurrency } from '../lib/utils';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  Wallet,
  PiggyBank,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  X
} from 'lucide-react';

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

interface AccountPreset {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'investment';
  icon: string;
  color: string;
  enabled: boolean;
  balance: string;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ isOpen, onClose, onCompleted }) => {
  const settings = useAppStore(state => state.settings);
  const setBaseCurrency = useAppStore(state => state.setBaseCurrency);
  const createAccount = useAppStore(state => state.createAccount);
  const setPin = useAppStore(state => state.setPin);
  const loadAccounts = useAppStore(state => state.loadAccounts);
  const loadMonthSummary = useAppStore(state => state.loadMonthSummary);
  const loadNetWorthSummary = useAppStore(state => state.loadNetWorthSummary);

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(settings?.base_currency || 'INR');
  const [numberFormat, setLocalNumberFormat] = useState<'indian' | 'international'>(
    (settings?.base_currency || 'INR') === 'INR' ? 'indian' : 'international'
  );

  const [enablePin, setEnablePin] = useState<boolean>(false);
  const [pinCode, setPinCode] = useState<string>('');
  const [confirmPinCode, setConfirmPinCode] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  const [accountsList, setAccountsList] = useState<AccountPreset[]>([
    {
      id: 'bank',
      name: 'Bank Account',
      type: 'bank',
      icon: 'Building2',
      color: '#3b82f6',
      enabled: true,
      balance: '',
    },
    {
      id: 'cash',
      name: 'Cash Wallet',
      type: 'cash',
      icon: 'Wallet',
      color: '#10b981',
      enabled: true,
      balance: '',
    },
    {
      id: 'savings',
      name: 'Savings',
      type: 'investment',
      icon: 'PiggyBank',
      color: '#8b5cf6',
      enabled: false,
      balance: '',
    },
  ]);

  if (!isOpen) return null;

  const handleCurrencyChange = (curr: string) => {
    setSelectedCurrency(curr);
    const format = curr === 'INR' ? 'indian' : 'international';
    setLocalNumberFormat(format);
  };

  const handleToggleAccount = (id: string) => {
    setAccountsList(prev =>
      prev.map(acc => (acc.id === id ? { ...acc, enabled: !acc.enabled } : acc))
    );
  };

  const handleUpdateAccount = (id: string, field: 'name' | 'balance', value: string) => {
    setAccountsList(prev =>
      prev.map(acc => (acc.id === id ? { ...acc, [field]: value } : acc))
    );
  };

  const handleNext = () => {
    if (currentStep === 2 && enablePin) {
      if (pinCode.length !== 6) {
        setPinError('PIN must be 6 digits.');
        return;
      }
      if (!/^\d{6}$/.test(pinCode)) {
        setPinError('Numbers 0-9 only.');
        return;
      }
      if (pinCode !== confirmPinCode) {
        setPinError('PINs do not match.');
        return;
      }
    }
    setPinError(null);
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setPinError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    try {
      // 1. Set Currency & Number format
      await setBaseCurrency(selectedCurrency);
      setNumberFormatSystem(numberFormat);
      autoSyncNumberFormatWithCurrency(selectedCurrency);

      // 2. Create accounts
      const activeAccounts = accountsList.filter(a => a.enabled && a.name.trim());
      for (const acc of activeAccounts) {
        const bal = parseFloat(acc.balance) || 0;
        await createAccount({
          name: acc.name.trim(),
          type: acc.type,
          currency: selectedCurrency,
          opening_balance: bal,
          color: acc.color,
          icon: acc.icon,
        });
      }

      // 3. Set PIN if selected
      if (enablePin && pinCode.length === 6 && pinCode === confirmPinCode) {
        await setPin(pinCode);
      }

      // 4. Complete
      localStorage.setItem('lyncost_wizard_completed', 'true');
      await Promise.all([
        loadAccounts(false),
        loadMonthSummary(),
        loadNetWorthSummary(),
      ]);

      if (onCompleted) onCompleted();
      onClose();
    } catch (err) {
      console.error('Wizard error:', err);
      setPinError('Failed to save settings. Please try again.');
    } finally {
      setIsFinishing(false);
    }
  };

  const currencySymbol = POPULAR_CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || selectedCurrency;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        
        {/* Compact Header */}
        <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-emerald-500/30 flex items-center justify-center shrink-0 bg-zinc-950">
              <img src="/logo-128.png" alt="Lyncost" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Quick Setup</h2>
              <p className="text-[11px] text-zinc-400">Step {currentStep} of 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Progress Line */}
        <div className="w-full bg-zinc-800 h-1">
          <div
            className="bg-purple-500 h-1 transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Step Body */}
        <div className="p-5 space-y-4">
          {/* STEP 1: CURRENCY */}
          {currentStep === 1 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Select Currency</h3>
                <p className="text-xs text-zinc-300 mt-0.5">Choose your primary accounting currency</p>
              </div>

              {/* Quick Currency Badges */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { code: 'INR', symbol: '₹' },
                  { code: 'USD', symbol: '$' },
                  { code: 'EUR', symbol: '€' },
                  { code: 'GBP', symbol: '£' },
                  { code: 'CAD', symbol: 'CA$' },
                  { code: 'AUD', symbol: 'A$' },
                  { code: 'JPY', symbol: '¥' },
                  { code: 'AED', symbol: 'AED' },
                ].map(curr => {
                  const isSelected = selectedCurrency === curr.code;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/20 text-white font-bold ring-1 ring-purple-500 shadow-sm'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      <span className="block text-sm font-bold text-purple-400">{curr.symbol}</span>
                      <span className="text-[10px] font-semibold">{curr.code}</span>
                    </button>
                  );
                })}
              </div>

              {/* Other Currencies Dropdown */}
              <div>
                <select
                  value={selectedCurrency}
                  onChange={e => handleCurrencyChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {POPULAR_CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.name} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Compact Preview */}
              <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Preview:</span>
                <span className="font-mono font-bold text-purple-400">
                  {currencySymbol} {numberFormat === 'indian' ? '10,00,000.00' : '1,000,000.00'}
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: STARTING ACCOUNTS */}
          {currentStep === 2 && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Starting Accounts</h3>
                <p className="text-xs text-zinc-300 mt-0.5">Add opening balances (or leave 0)</p>
              </div>

              <div className="space-y-2">
                {accountsList.map(acc => (
                  <div
                    key={acc.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      acc.enabled
                        ? 'bg-zinc-950/80 border-zinc-800'
                        : 'bg-zinc-950/30 border-dashed border-zinc-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleAccount(acc.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          acc.enabled ? 'bg-purple-600 text-white' : 'border border-zinc-600 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      {acc.id === 'bank' && <Building2 className="w-4 h-4 text-blue-400 shrink-0" />}
                      {acc.id === 'cash' && <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {acc.id === 'savings' && <PiggyBank className="w-4 h-4 text-purple-400 shrink-0" />}

                      <input
                        type="text"
                        value={acc.name}
                        disabled={!acc.enabled}
                        onChange={e => handleUpdateAccount(acc.id, 'name', e.target.value)}
                        className="text-xs font-semibold bg-transparent border-none focus:outline-none text-zinc-200 truncate w-full"
                      />
                    </div>

                    {acc.enabled && (
                      <div className="relative w-28 shrink-0">
                        <span className="absolute left-2.5 top-1.5 text-xs text-zinc-500 font-bold">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          step="any"
                          placeholder="0"
                          value={acc.balance}
                          onChange={e => handleUpdateAccount(acc.id, 'balance', e.target.value)}
                          className="w-full pl-6 pr-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-bold text-white text-right focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-zinc-500">
                You can rename, delete, or create more accounts anytime in Accounts tab.
              </p>
            </div>
          )}

          {/* STEP 3: SECURITY & FINISH */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Security & Finish</h3>
                <p className="text-xs text-zinc-300 mt-0.5">Optional passcode protection</p>
              </div>

              {/* PIN Toggle */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Lock with 6-Digit PIN</span>
                    <span className="text-[11px] text-zinc-400">Require PIN when opening app</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEnablePin(prev => !prev);
                    setPinError(null);
                  }}
                  className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                    enablePin ? 'bg-purple-600' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    enablePin ? 'left-5' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* PIN Inputs if Enabled */}
              {enablePin && (
                <div className="space-y-2.5 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1 font-semibold">6-Digit PIN</label>
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={6}
                        value={pinCode}
                        onChange={e => {
                          setPinError(null);
                          setPinCode(e.target.value.replace(/\D/g, ''));
                        }}
                        placeholder="••••••"
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold tracking-widest text-center focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1 font-semibold">Confirm PIN</label>
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={6}
                        value={confirmPinCode}
                        onChange={e => {
                          setPinError(null);
                          setConfirmPinCode(e.target.value.replace(/\D/g, ''));
                        }}
                        placeholder="••••••"
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold tracking-widest text-center focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <button
                      type="button"
                      onClick={() => setShowPin(prev => !prev)}
                      className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPin ? 'Hide' : 'Show'}</span>
                    </button>
                    {pinError && <span className="text-rose-400 font-semibold">{pinError}</span>}
                  </div>
                </div>
              )}

              {/* Clean Summary Pill */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Ready to start with:</span>
                <span className="font-bold text-purple-300">
                  {selectedCurrency} • {accountsList.filter(a => a.enabled).length} Account(s)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/50 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isFinishing}
              className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-purple-950/40 disabled:opacity-50"
            >
              {isFinishing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Launch Lyncost</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
