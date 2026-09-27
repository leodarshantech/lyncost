// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import App from '../App';
import { useAppStore } from '../store/useAppStore';
import type { TrialStatus } from '../types';

const settings = { id: 1, base_currency: 'USD', has_pin: false, theme: 'dark', notify_os: false, notify_advance_days: 1 };
const account = { id: 1, name: 'Bank', type: 'bank', currency: 'USD', opening_balance: 0, current_balance: 100, icon: null, color: null, is_archived: 0, created_at: '2026-01-01' };

function mockBackend(trial: TrialStatus) {
  mockIPC((cmd) => {
    switch (cmd) {
      case 'get_trial_status': return trial;
      case 'get_startup_status': return null;
      case 'get_app_settings': return settings;
      case 'get_accounts': return [account];
      case 'get_month_summary': return { month: '2026-09', total_income: 0, total_expense: 0, net_cashflow: 0, pending_count: 0, pending_expense_total: 0 };
      case 'get_net_worth_summary': return { base_currency: 'USD', total_bank: 100, total_cash: 0, total_investments: 0, total_other_accounts: 0, total_accounts: 100, total_debts: 0, net_worth: 100 };
      case 'get_portfolio_summary': return { total_invested_base: 0, total_current_value_base: 0, total_unrealized_pnl_base: 0, total_unrealized_pnl_percent: 0, holdings_count: 0 };
      case 'check_app_update': return { has_update: false, current_version: '0.1.7', latest_version: '0.1.7', release_notes: '', published_at: '', download_url: '' };
      case 'process_recurring_rules': return 0;
      case 'check_and_snapshot_net_worth':
      case 'check_and_run_daily_backup': return null;
      default: return [];
    }
  });
}

describe('Windows 14-day trial', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    Object.defineProperty(window.navigator, 'userAgent', { value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', configurable: true });
    localStorage.clear();
    localStorage.setItem('lyncost_wizard_completed', 'true');
    useAppStore.setState({ isUnlocked: false, isLoading: true, settings: null, error: null, startupError: null });
  });

  afterEach(() => {
    cleanup();
    clearMocks();
    vi.unstubAllGlobals();
  });

  it('opens the full app with a countdown banner during the trial', async () => {
    mockBackend({ started_at: '1', days_total: 14, days_remaining: 10, is_expired: false });
    render(<App />);
    expect(await screen.findByText(/Free trial: 10 days left/)).toBeTruthy();
    expect(screen.queryByText('Your free trial has ended')).toBeNull();
  });

  it('lets a trial user enter a key and go back to the app without one', async () => {
    mockBackend({ started_at: '1', days_total: 14, days_remaining: 3, is_expired: false });
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /Enter key/ }));
    expect(await screen.findByText('Activate Lyncost')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Continue free trial \(3 days left\)/ }));
    expect(screen.queryByText('Activate Lyncost')).toBeNull();
    expect(screen.getByText(/Free trial: 3 days left/)).toBeTruthy();
  });

  it('asks for a key once the trial has ended, without deleting anything', async () => {
    mockBackend({ started_at: '1', days_total: 14, days_remaining: 0, is_expired: true });
    render(<App />);
    expect(await screen.findByText('Your free trial has ended')).toBeTruthy();
    expect(screen.getByText(/nothing has been deleted/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Continue free trial/ })).toBeNull();
  });

  it('never shows the trial to an activated Windows install', async () => {
    localStorage.setItem('lyncost_license_activated', 'true');
    mockBackend({ started_at: '1', days_total: 14, days_remaining: 0, is_expired: true });
    render(<App />);
    expect(await screen.findByText('Financial Dashboard')).toBeTruthy();
    expect(screen.queryByText(/Free trial/)).toBeNull();
    expect(screen.queryByText('Your free trial has ended')).toBeNull();
  });
});
