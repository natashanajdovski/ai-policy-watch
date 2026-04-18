import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { Bill, RFI, Hearing, Meta } from '@scripts/lib/schema';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function read<T>(rel: string, fallback: T): T {
  const p = join(ROOT, rel);
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

export function loadBills(): Bill[] {
  return read<Bill[]>('data/bills.json', []);
}
export function loadRFIs(): RFI[] {
  return read<RFI[]>('data/rfis.json', []);
}
export function loadHearings(): Hearing[] {
  return read<Hearing[]>('data/hearings.json', []);
}
export function loadMeta(): Meta | null {
  return read<Meta | null>('data/_meta.json', null);
}
