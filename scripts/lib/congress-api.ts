// Minimal Congress.gov API client.
// Docs: https://api.congress.gov/
// Rate limit: 5,000 requests per hour. We rate-limit ourselves to ~1 req/sec.

const BASE = 'https://api.congress.gov/v3';
const MIN_GAP_MS = 1000;

let lastCallAt = 0;

async function throttle() {
  const elapsed = Date.now() - lastCallAt;
  if (elapsed < MIN_GAP_MS) {
    await new Promise((r) => setTimeout(r, MIN_GAP_MS - elapsed));
  }
  lastCallAt = Date.now();
}

function requireKey(): string {
  const key = process.env.CONGRESS_API_KEY;
  if (!key || key.trim() === '') {
    throw new Error(
      'CONGRESS_API_KEY is not set. Copy .env.example to .env and add your key ' +
        'from https://api.congress.gov/sign-up/.',
    );
  }
  return key;
}

const MAX_ATTEMPTS = 4;

async function request<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_key', requireKey());
  url.searchParams.set('format', 'json');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await throttle();
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
      });
      if (res.status === 429 || res.status >= 500) {
        // Transient server/rate error. Back off and retry.
        lastErr = new Error(`Congress.gov ${res.status} ${res.statusText}`);
        await sleep(backoffMs(attempt));
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(
          `Congress.gov ${res.status} ${res.statusText} for ${path} — ${body.slice(0, 200)}`,
        );
      }
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      const code = (err as { cause?: { code?: string }; code?: string }).cause?.code
        ?? (err as { code?: string }).code;
      const retryable =
        err instanceof TypeError ||
        code === 'UND_ERR_SOCKET' ||
        code === 'ECONNRESET' ||
        code === 'ETIMEDOUT' ||
        code === 'ENOTFOUND';
      if (!retryable || attempt === MAX_ATTEMPTS) throw err;
      await sleep(backoffMs(attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function backoffMs(attempt: number): number {
  return 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s, 8s
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------- Bills ----------

export type ApiBillListItem = {
  congress: number;
  number: string;
  type: string; // e.g., "HR", "S", "HJRES"
  title: string;
  originChamber: string;
  originChamberCode: string;
  latestAction?: { actionDate: string; text: string };
  updateDate: string;
  updateDateIncludingText?: string;
  url: string;
};

export type ApiBillDetail = {
  congress: number;
  number: string;
  type: string;
  title: string;
  introducedDate?: string;
  originChamber?: string;
  policyArea?: { name: string };
  sponsors?: Array<{
    firstName?: string;
    lastName?: string;
    fullName?: string;
    party?: string;
    state?: string;
    bioguideId?: string;
  }>;
  cosponsors?: { count?: number };
  committees?: { count?: number; items?: Array<{ name?: string; chamber?: string }> };
  latestAction?: { actionDate?: string; text?: string };
  laws?: Array<{ type?: string; number?: string }>;
  updateDate?: string;
  updateDateIncludingText?: string;
};

export type ApiBillSubjects = {
  policyArea?: { name: string; updateDate?: string };
  legislativeSubjects?: Array<{ name: string; updateDate?: string }>;
};

// List bills for a congress. Pages through results until `limit` is reached
// or the API has no more. Pass `fromDateTime` to restrict by update time.
export async function listBills(args: {
  congress: number;
  fromDateTime?: string; // ISO, e.g., "2025-10-01T00:00:00Z"
  maxResults?: number;
}): Promise<ApiBillListItem[]> {
  const pageSize = 250;
  const out: ApiBillListItem[] = [];
  let offset = 0;
  const max = args.maxResults ?? 10_000;

  while (out.length < max) {
    const params: Record<string, string | number> = {
      offset,
      limit: pageSize,
      sort: 'updateDate+desc',
    };
    if (args.fromDateTime) params.fromDateTime = args.fromDateTime;

    const res = await request<{ bills: ApiBillListItem[]; pagination?: { next?: string } }>(
      `/bill/${args.congress}`,
      params,
    );
    const page = res.bills ?? [];
    out.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
    if (!res.pagination?.next) break;
  }
  return out.slice(0, max);
}

export async function getBillDetail(args: {
  congress: number;
  type: string;
  number: string;
}): Promise<ApiBillDetail> {
  const res = await request<{ bill: ApiBillDetail }>(
    `/bill/${args.congress}/${args.type.toLowerCase()}/${args.number}`,
  );
  return res.bill;
}

export async function getBillSubjects(args: {
  congress: number;
  type: string;
  number: string;
}): Promise<ApiBillSubjects> {
  const res = await request<{ subjects: ApiBillSubjects }>(
    `/bill/${args.congress}/${args.type.toLowerCase()}/${args.number}/subjects`,
  );
  return res.subjects ?? {};
}

export type ApiBillAction = {
  actionDate?: string;
  text?: string;
  type?: string;
  actionCode?: string;
};

export async function getBillActions(args: {
  congress: number;
  type: string;
  number: string;
}): Promise<ApiBillAction[]> {
  // Actions can be paginated for long-lived bills; one page of 250 is
  // plenty for stage detection since we only care whether any action
  // matches certain key phrases.
  const res = await request<{ actions?: ApiBillAction[] }>(
    `/bill/${args.congress}/${args.type.toLowerCase()}/${args.number}/actions`,
    { limit: 250 },
  );
  return res.actions ?? [];
}

// ---------- Committee meetings (hearings source) ----------

export type ApiCommitteeMeetingListItem = {
  eventId: string;
  chamber: string; // "House" | "Senate" | "NoChamber"
  congress: number;
  updateDate: string;
  url: string;
};

export type ApiCommitteeMeetingDetail = {
  eventId: string;
  chamber: string;
  congress: number;
  type?: string;
  title?: string;
  date?: string;
  meetingStatus?: string;
  committees?: Array<{ name?: string; systemCode?: string; url?: string }>;
  location?: { building?: string; room?: string; address?: string } | null;
  witnesses?: Array<{ name?: string; position?: string; organization?: string }>;
  videos?: Array<{ name?: string; url?: string }>;
  relatedItems?: Record<string, unknown>;
};

export async function listCommitteeMeetings(args: {
  congress: number;
  chamber: 'house' | 'senate';
  maxResults?: number;
}): Promise<ApiCommitteeMeetingListItem[]> {
  const pageSize = 250;
  const out: ApiCommitteeMeetingListItem[] = [];
  let offset = 0;
  const max = args.maxResults ?? 2_000;

  while (out.length < max) {
    const res = await request<{
      committeeMeetings: ApiCommitteeMeetingListItem[];
      pagination?: { next?: string };
    }>(`/committee-meeting/${args.congress}/${args.chamber}`, {
      offset,
      limit: pageSize,
    });
    const page = res.committeeMeetings ?? [];
    out.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
    if (!res.pagination?.next) break;
  }
  return out.slice(0, max);
}

export async function getCommitteeMeeting(args: {
  congress: number;
  chamber: 'house' | 'senate';
  eventId: string;
}): Promise<ApiCommitteeMeetingDetail> {
  const res = await request<{ committeeMeeting: ApiCommitteeMeetingDetail }>(
    `/committee-meeting/${args.congress}/${args.chamber}/${args.eventId}`,
  );
  return res.committeeMeeting;
}
