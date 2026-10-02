import React, { useState } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';
import { Key, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, Laptop, RefreshCw } from 'lucide-react';

interface LicenseActivationScreenProps {
  onActivated: () => void;
  /** The 14-day trial is over: explain that data is safe and a key unlocks it again */
  trialExpired?: boolean;
  /** Shown during an active trial: lets the user go back to the app without a key */
  onClose?: () => void;
  trialDaysRemaining?: number;
}

export const LicenseActivationScreen: React.FC<LicenseActivationScreenProps> = ({
  onActivated,
  trialExpired = false,
  onClose,
  trialDaysRemaining,
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setError(null);
    setLicenseKey(e.target.value);
  };

  const validateAndActivate = async () => {
    setError(null);
    const cleaned = licenseKey.replace(/\s+/g, '').toUpperCase();

    if (!cleaned) {
      setError('Please paste your license key.');
      return;
    }

    setIsActivating(true);
    let valid = false;
    try {
      // Verified offline by the app core against the Lyncost public key (Ed25519 signature)
      valid = await invoke<boolean>('verify_license_key', { key: cleaned });
    } catch {
      valid = false;
    }

    if (!valid) {
      setIsActivating(false);
      setError(
        cleaned.startsWith('LYNC-') && cleaned.length <= 19
          ? 'This is an older-format key. Get your updated key at lyncost.wintershogun.com/license using your payment ID.'
          : 'This license key is not valid. Please copy the whole key from your purchase screen (it starts with LYNC2-).',
      );
      return;
    }

    try {
      localStorage.setItem('lyncost_license_key', cleaned);
      localStorage.setItem('lyncost_license_activated', 'true');
      localStorage.setItem('lyncost_activated_at', new Date().toISOString());
      setIsActivating(false);
      setIsSuccess(true);
      setTimeout(() => onActivated(), 1200);
    } catch (err: unknown) {
      setIsActivating(false);
      setError('Failed to save activation locally: ' + (err instanceof Error ? err.message : 'Storage error'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateAndActivate();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 text-white select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[250px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900/90 border border-zinc-800/90 p-6 sm:p-8 shadow-2xl shadow-zinc-950 backdrop-blur-xl text-center space-y-6">
        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
          ) : (
            <Key className="w-8 h-8 text-emerald-400" />
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/80 text-[11px] font-mono text-zinc-300">
            <Laptop className="w-3.5 h-3.5 text-emerald-400" />
            <span>{/Macintosh|Mac OS X/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '') ? 'macOS' : 'Windows'} Edition • Lifetime License</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isSuccess ? 'Activation Successful!' : trialExpired ? 'Your free trial has ended' : 'Activate Lyncost'}
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            {isSuccess
              ? 'Your perpetual lifetime license is verified. Launching your private offline dashboard...'
              : trialExpired
                ? 'Thanks for trying Lyncost! Your data is safe on this PC and nothing has been deleted. Enter a license key to keep using it.'
                : 'Paste the license key from your purchase screen to unlock the software. Lost it? Recover it at lyncost.wintershogun.com/license.'}
          </p>
        </div>

        {/* License Input & Action */}
        {!isSuccess && (
          <div className="space-y-3 text-left">
            <label className="block text-xs font-bold text-zinc-300 tracking-wider uppercase">
              License Key
            </label>
            <div className="relative">
              <textarea
                value={licenseKey}
                onChange={handleKeyChange}
                onKeyDown={handleKeyDown}
                placeholder="Paste your key here (starts with LYNC2-)"
                rows={4}
                spellCheck={false}
                autoComplete="off"
                aria-label="License key"
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300 font-semibold break-all resize-none select-text placeholder-zinc-600 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* rounded-[0.75rem] (= rounded-xl) and no "bg-zinc-800" class on purpose: App.css
                theme rules match class substrings and would repaint this green button as a card */}
            <button
              onClick={validateAndActivate}
              disabled={isActivating || licenseKey.trim().length === 0}
              className="w-full py-3 px-4 rounded-[0.75rem] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isActivating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying License...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Activate Perpetual License
                </>
              )}
            </button>
          </div>
        )}

        {!isSuccess && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800/60 text-xs font-semibold transition-colors cursor-pointer"
          >
            Continue free trial
            {typeof trialDaysRemaining === 'number' ? ` (${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left)` : ''}
          </button>
        )}

        {/* Footer info & Links */}
        {!isSuccess && (
          <div className="pt-4 border-t border-zinc-800/80 space-y-2 text-[11px] text-zinc-500">
            <p className="flex items-center justify-center gap-1">
              {trialExpired ? 'Need a license key?' : "Don't have a license key?"}{' '}
              <button
                type="button"
                onClick={() => {
                  // Webview links with target=_blank do nothing; open in the system browser
                  openUrl('https://lyncost.wintershogun.com').catch(() => {
                    window.open('https://lyncost.wintershogun.com', '_blank', 'noopener');
                  });
                }}
                className="text-emerald-400 hover:underline inline-flex items-center gap-0.5 font-medium cursor-pointer"
              >
                Purchase here <ExternalLink className="w-3 h-3" />
              </button>
            </p>
            <p>
              Need help? Contact{' '}
              <span className="font-mono text-zinc-400">darshantech@proton.me</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
