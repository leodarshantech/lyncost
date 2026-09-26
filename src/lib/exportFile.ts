import { invoke } from '@tauri-apps/api/core';

/** Quotes a CSV cell and neutralises spreadsheet formula injection (=, +, -, @). */
function csvCell(value: string | number | null | undefined): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let text = value ?? '';
  if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

/**
 * Saves a text export. In the desktop app it is written to the Downloads folder by the
 * backend (webview `<a download>` links are unreliable); returns the saved path.
 * In a plain browser preview it falls back to a normal download and returns null.
 */
export async function saveTextFile(fileName: string, contents: string): Promise<string | null> {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  if (isTauri) {
    return invoke<string>('save_export_file', { fileName, contents });
  }

  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return null;
}

/** Saves a CSV and tells the user where it went. */
export async function exportCsvWithNotice(fileName: string, rows: (string | number | null | undefined)[][]): Promise<void> {
  try {
    const path = await saveTextFile(fileName, toCsv(rows));
    if (path) alert(`Exported to:\n${path}`);
  } catch (err: unknown) {
    alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
