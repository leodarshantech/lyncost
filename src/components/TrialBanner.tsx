import React from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { Clock, KeyRound, ExternalLink } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface TrialBannerProps {
  daysRemaining: number;
  onActivate: () => void;
}

const PURCHASE_URL = 'https://lyncost.wintershogun.com/#download';

/** Windows-only: shown at the top of the app while the 14-day trial is running. */
export const TrialBanner: React.FC<TrialBannerProps> = ({ daysRemaining, onActivate }) => {
  const theme = useAppStore(state => state.theme);
  const isLight = theme === 'light';
  const urgent = daysRemaining <= 3;

  return (
    <div
      className={`mb-6 px-4 py-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        urgent
          ? isLight
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-100'
          : isLight
            ? 'bg-slate-50 border-slate-200 text-slate-800'
            : 'bg-zinc-900 border-zinc-800 text-zinc-200'
      }`}
    >
      <div className="flex items-center gap-3 text-sm">
        <Clock className={`w-4 h-4 shrink-0 ${urgent ? 'text-amber-500' : 'text-purple-400'}`} />
        <span>
          <strong className="font-semibold">
            Free trial: {daysRemaining} day{daysRemaining === 1 ? '' : 's'} left.
          </strong>{' '}
          <span className={isLight ? 'text-slate-600' : 'text-zinc-400'}>
            Everything is unlocked. Your data stays on this PC, even after the trial.
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            openUrl(PURCHASE_URL).catch(() => window.open(PURCHASE_URL, '_blank', 'noopener'));
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
            isLight
              ? 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
              : 'border-zinc-700 hover:bg-zinc-800 text-zinc-200'
          }`}
        >
          Buy license <ExternalLink className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onActivate}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          <KeyRound className="w-3.5 h-3.5" /> Enter key
        </button>
      </div>
    </div>
  );
};
