import React, { useState } from 'react';
import { Key, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink, Laptop, RefreshCw } from 'lucide-react';

interface LicenseActivationScreenProps {
  onActivated: () => void;
}

export const LicenseActivationScreen: React.FC<LicenseActivationScreenProps> = ({ onActivated }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Format key as user types: LYNC-XXXX-XXXX-XXXX
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Auto-insert dashes
    if (raw.startsWith('LYNC')) {
      raw = raw.slice(4);
    }
    const parts = [];
    for (let i = 0; i < raw.length && i < 12; i += 4) {
      parts.push(raw.slice(i, i + 4));
    }
    const formatted = 'LYNC' + (parts.length > 0 ? '-' + parts.join('-') : '');
    setLicenseKey(formatted);
  };

  const validateAndActivate = () => {
    setError(null);
    const cleaned = licenseKey.trim().toUpperCase();

    // Regex for LYNC-XXXX-XXXX-XXXX where X is 0-9 or A-F
    const licenseRegex = /^LYNC-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/;

    if (!cleaned) {
      setError('Please enter your license key.');
      return;
    }

    if (!licenseRegex.test(cleaned)) {
      setError('Invalid license format. Format must be: LYNC-XXXX-XXXX-XXXX (16 characters).');
      return;
    }

    setIsActivating(true);

    // Simulate cryptographic verification & save local activation flag
    setTimeout(() => {
      try {
        localStorage.setItem('lyncost_license_key', cleaned);
        localStorage.setItem('lyncost_license_activated', 'true');
        localStorage.setItem('lyncost_activated_at', new Date().toISOString());

        setIsActivating(false);
        setIsSuccess(true);

        setTimeout(() => {
          onActivated();
        }, 1200);
      } catch (err: any) {
        setIsActivating(false);
        setError('Failed to save activation locally: ' + (err?.message || 'Storage error'));
      }
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
            <span>Windows Edition • Lifetime License</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isSuccess ? 'Activation Successful!' : 'Activate Lyncost'}
          </h2>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            {isSuccess
              ? 'Your perpetual lifetime license is verified. Launching your private offline dashboard...'
              : 'Enter the 16-character license key provided on your purchase screen to unlock the software.'}
          </p>
        </div>

        {/* License Input & Action */}
        {!isSuccess && (
          <div className="space-y-3 text-left">
            <label className="block text-xs font-bold text-zinc-300 tracking-wider uppercase">
              License Key
            </label>
            <div className="relative">
              <input
                type="text"
                value={licenseKey}
                onChange={handleKeyChange}
                onKeyDown={handleKeyDown}
                placeholder="LYNC-XXXX-XXXX-XXXX"
                maxLength={19}
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm font-mono text-emerald-300 font-bold tracking-widest placeholder-zinc-600 focus:outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/20 transition-all text-center"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={validateAndActivate}
              disabled={isActivating || licenseKey.length < 19}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isActivating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying License...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Activate Perpetual License</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer info & Links */}
        {!isSuccess && (
          <div className="pt-4 border-t border-zinc-800/80 space-y-2 text-[11px] text-zinc-500">
            <p className="flex items-center justify-center gap-1">
              Don't have a license key?{' '}
              <a
                href="https://lyncost.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline inline-flex items-center gap-0.5 font-medium"
              >
                Purchase here <ExternalLink className="w-3 h-3" />
              </a>
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
