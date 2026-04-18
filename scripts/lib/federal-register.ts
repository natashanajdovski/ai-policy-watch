// Federal Register API client.
// Docs: https://www.federalregister.gov/developers/documentation/api/v1
// No API key required.

const BASE = 'https://www.federalregister.gov/api/v1';
const MIN_GAP_MS = 500;

let lastCallAt = 0;

async function throttle() {
  const elapsed = Date.now() - lastCallAt;
  if (elapsed < MIN_GAP_MS) {
    await new Promise((r) => setTimeout(r, MIN_GAP_MS - elapsed));
  }
  lastCallAt = Date.now();
}

async function request<T>(path: string, params: URLSearchParams): Promise<T> {
  await throttle();
  const url = `${BASE}${path}?${params.toString()}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Federal Register ${res.status} ${res.statusText} — ${body.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

export type ApiFRDocument = {
  document_number: string;
  title: string;
  abstract?: string | null;
  type?: string; // "Notice", "Rule", "Proposed Rule", "Presidential Document"
  publication_date?: string;
  comments_close_on?: string | null;
  effective_on?: string | null;
  html_url: string;
  pdf_url?: string;
  regulations_dot_gov_info?: {
    docket_id?: string;
    comments_url?: string | null;
  } | null;
  agencies?: Array<{ name?: string; raw_name?: string; slug?: string }>;
  docket_ids?: string[];
};

type ApiFRSearchResponse = {
  count: number;
  results: ApiFRDocument[];
  next_page_url?: string | null;
};

// Search Federal Register documents that match a free-text term. We run
// one search per keyword to maximize recall, then de-duplicate by
// document_number. Results are restricted to publication dates within
// `sinceDate` (YYYY-MM-DD).
export async function searchDocuments(args: {
  terms: string[];
  sinceDate: string;
  types?: Array<'NOTICE' | 'RULE' | 'PRORULE' | 'PRESDOCU'>;
  maxPerTerm?: number;
}): Promise<ApiFRDocument[]> {
  const seen = new Map<string, ApiFRDocument>();
  const types = args.types ?? ['NOTICE', 'PRORULE'];

  for (const term of args.terms) {
    let nextUrl: string | null = null;
    let count = 0;
    do {
      const params = new URLSearchParams();
      params.set('per_page', '100');
      params.set('order', 'newest');
      params.set('conditions[term]', term);
      params.set('conditions[publication_date][gte]', args.sinceDate);
      for (const t of types) params.append('conditions[type][]', t);
      // Fields to return (keeps payloads small).
      for (const f of [
        'document_number',
        'title',
        'abstract',
        'type',
        'publication_date',
        'comments_close_on',
        'effective_on',
        'html_url',
        'pdf_url',
        'regulations_dot_gov_info',
        'agencies',
        'docket_ids',
      ]) {
        params.append('fields[]', f);
      }

      const res: ApiFRSearchResponse = nextUrl
        ? await fetchRaw<ApiFRSearchResponse>(nextUrl)
        : await request<ApiFRSearchResponse>('/documents.json', params);

      for (const doc of res.results ?? []) {
        if (!seen.has(doc.document_number)) seen.set(doc.document_number, doc);
      }
      count += (res.results ?? []).length;
      nextUrl = res.next_page_url ?? null;
      if (args.maxPerTerm && count >= args.maxPerTerm) break;
    } while (nextUrl);
  }

  return Array.from(seen.values());
}

async function fetchRaw<T>(url: string): Promise<T> {
  await throttle();
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Federal Register ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}
