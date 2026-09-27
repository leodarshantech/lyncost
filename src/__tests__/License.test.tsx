// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, screen, fireEvent } from '@testing-library/react';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { LicenseActivationScreen } from '../components/LicenseActivationScreen';

const GOOD = 'LYNC2-GOODKEY00-AAAAAAAAA';

describe('License activation', () => {
  let verified: string[];

  beforeEach(() => {
    verified = [];
    localStorage.clear();
    mockIPC((cmd, args) => {
      if (cmd === 'verify_license_key') {
        const key = (args as { key: string }).key;
        verified.push(key);
        return key === GOOD;
      }
      return null;
    });
  });

  afterEach(() => {
    cleanup();
    clearMocks();
    vi.useRealTimers();
  });

  const paste = (text: string) =>
    fireEvent.change(screen.getByRole('textbox', { name: 'License key' }), { target: { value: text } });

  it('accepts a genuine key (verified by the app core) and remembers it', async () => {
    const onActivated = vi.fn();
    render(<LicenseActivationScreen onActivated={onActivated} />);
    // pasted with lower case, spaces and a line break
    paste(`  ${GOOD.toLowerCase().replace('aaaa', 'aa aa')}\n`);
    fireEvent.click(screen.getByRole('button', { name: /Activate/ }));
    expect(await screen.findByText('Activation Successful!')).toBeTruthy();
    expect(verified).toEqual([GOOD]);
    expect(localStorage.getItem('lyncost_license_activated')).toBe('true');
    expect(localStorage.getItem('lyncost_license_key')).toBe(GOOD);
  });

  it('rejects a fake key and does not activate', async () => {
    const onActivated = vi.fn();
    render(<LicenseActivationScreen onActivated={onActivated} />);
    paste('LYNC2-FAKEFAKE0-BBBBBBBBB');
    fireEvent.click(screen.getByRole('button', { name: /Activate/ }));
    expect(await screen.findByText(/not valid/)).toBeTruthy();
    expect(localStorage.getItem('lyncost_license_activated')).toBeNull();
    expect(onActivated).not.toHaveBeenCalled();
  });

  it('explains how to get a new key when an old-format key is pasted', async () => {
    render(<LicenseActivationScreen onActivated={vi.fn()} />);
    paste('LYNC-0000-0000-0000');
    fireEvent.click(screen.getByRole('button', { name: /Activate/ }));
    expect(await screen.findByText(/older-format key/)).toBeTruthy();
    expect(localStorage.getItem('lyncost_license_activated')).toBeNull();
  });
});
