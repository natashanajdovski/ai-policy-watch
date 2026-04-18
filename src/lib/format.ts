// Date and label formatting helpers. All intentionally neutral — the tone
// principle is "train schedule," not "urgency banner."

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Neutral "N days remaining" phrasing — reads like metadata, not a count-down.
export function daysRemaining(closeIso: string | null | undefined): string {
  if (!closeIso) return '';
  const close = new Date(closeIso).getTime();
  if (Number.isNaN(close)) return '';
  const diff = Math.ceil((close - Date.now()) / (24 * 60 * 60 * 1000));
  if (diff < 0) return 'Closed';
  if (diff === 0) return 'Closes today';
  if (diff === 1) return '1 day remaining';
  return `${diff} days remaining`;
}

function capitalize(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

export function chamberLabel(c: 'house' | 'senate' | 'joint'): string {
  if (c === 'house') return 'House';
  if (c === 'senate') return 'Senate';
  return 'Joint';
}

export function statusLabel(raw: string): string {
  return raw
    .split('_')
    .map((w) => capitalize(w))
    .join(' ');
}

// Character-limited truncation. Keeps the full text available to the caller
// so it can be used as a hover title.
export function truncate(s: string, max = 80): string {
  if (!s) return '';
  const clean = s.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, '') + '…';
}
