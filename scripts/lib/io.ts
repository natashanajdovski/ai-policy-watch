import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const REPO_ROOT = join(import.meta.dirname ?? __dirname, '..', '..');

export function writeJson(relativePath: string, value: unknown) {
  const fullPath = join(REPO_ROOT, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, JSON.stringify(value, null, 2) + '\n', 'utf-8');
}

export function readJson<T>(relativePath: string): T | null {
  const fullPath = join(REPO_ROOT, relativePath);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, 'utf-8')) as T;
}

export function nowIso(): string {
  return new Date().toISOString();
}
