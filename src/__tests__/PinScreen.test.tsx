// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup, fireEvent } from '@testing-library/react';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { PinScreen } from '../components/PinScreen';
import { useAppStore } from '../store/useAppStore';

const settings = {
  id: 1,
  base_currency: 'INR',
  has_pin: true,
  theme: 'dark',
  notify_os: false,
  notify_advance_days: 1,
};

const pressKey = async (key: string) => {
  await act(async () => {
    fireEvent.keyDown(window, { key });
  });
};

const filledDots = (container: HTMLElement) => container.querySelectorAll('.bg-purple-500').length;

describe('PinScreen keyboard input', () => {
  let verifyCalls: string[];

  beforeEach(() => {
    verifyCalls = [];
    mockIPC((cmd, args) => {
      if (cmd === 'verify_pin') {
        const pin = (args as { pin: string }).pin;
        verifyCalls.push(pin);
        return pin === '123456'
          ? { valid: true, lockout_seconds: 0, remaining_attempts: 5 }
          : { valid: false, lockout_seconds: 0, remaining_attempts: 4 };
      }
      if (cmd === 'get_app_settings') return settings;
      if (cmd === 'check_app_update') return { has_update: false };
      if (cmd === 'process_recurring_rules') return 0;
      if (cmd === 'check_and_run_daily_backup') return null;
      if (cmd === 'check_and_snapshot_net_worth') return null;
      if (cmd === 'get_month_summary') return null;
      return [];
    });
    useAppStore.setState({ settings, isUnlocked: false, error: null });
  });

  afterEach(() => {
    cleanup();
    clearMocks();
  });

  it('accumulates all six typed digits and unlocks with the correct PIN', async () => {
    const { container } = render(<PinScreen />);

    for (const d of '12345') await pressKey(d);
    expect(filledDots(container)).toBe(5);

    await pressKey('6');
    expect(verifyCalls).toEqual(['123456']);
    expect(useAppStore.getState().isUnlocked).toBe(true);
  });

  it('supports Backspace while typing', async () => {
    render(<PinScreen />);
    for (const key of ['1', '2', '9', 'Backspace', '3', '4', '5', '6']) await pressKey(key);
    expect(verifyCalls).toEqual(['123456']);
  });

  it('shows remaining attempts on a wrong PIN and clears the input', async () => {
    const { container, findByText } = render(<PinScreen />);
    for (const d of '000000') await pressKey(d);
    expect(verifyCalls).toEqual(['000000']);
    expect(await findByText(/4 attempts remaining/)).toBeTruthy();
    expect(filledDots(container)).toBe(0);
    expect(useAppStore.getState().isUnlocked).toBe(false);
  });

  it('shows the backend lockout countdown and blocks typing', async () => {
    mockIPC((cmd) =>
      cmd === 'verify_pin' ? { valid: false, lockout_seconds: 30, remaining_attempts: 0 } : [],
    );
    const { findByText } = render(<PinScreen />);
    for (const d of '111111') await pressKey(d);
    expect(await findByText(/Try again in 30s/)).toBeTruthy();
  });
});
