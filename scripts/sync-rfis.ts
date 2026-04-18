import 'dotenv/config';
import { loadConfig, buildOverrideSets } from './lib/config';
import { searchDocuments, type ApiFRDocument } from './lib/federal-register';
import { decideScope } from './lib/scope-filter';
import { readJson, writeJson, nowIso } from './lib/io';
import { RFI, type RFI as RFIT, type Meta } from './lib/schema';

const INITIAL_LOOKBACK_DAYS = 365;

function rfiId(doc: ApiFRDocument): string {
  return `rfi-${doc.document_number}`;
}

function statusFor(doc: ApiFRDocument): 'open' | 'closed' {
  if (!doc.comments_close_on) return 'closed';
  const close = Date.parse(doc.comments_close_on);
  if (Number.isNaN(close)) return 'closed';
  // Grace period of 1 day to account for timezone boundaries.
  return close + 24 * 60 * 60 * 1000 >= Date.now() ? 'open' : 'closed';
}

function agencyName(doc: ApiFRDocument): string {
  const first = (doc.agencies ?? [])[0];
  return first?.name ?? first?.raw_name ?? 'Unknown agency';
}

async function main() {
  const config = loadConfig();
  const includeIds = buildOverrideSets(config.include).rfis;
  const excludeIds = buildOverrideSets(config.exclude).rfis;

  const prev = readJson<RFIT[]>('data/rfis.json') ?? [];
  const prevAddedAt = new Map(prev.map((r) => [r.id, r.added_at]));
  const prevMeta = readJson<Meta>('data/_meta.json');

  const since = new Date(Date.now() - INITIAL_LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // We don't include bare "ai" in the Federal Register search: FR titles
  // often contain the letters AI in unrelated acronyms and FR's search is
  // substring-based rather than token-based, so it would dilute recall.
  const searchTerms = config.keywords.filter((k) => k !== 'ai');

  console.log(`[rfis] Searching Federal Register since ${since} across ${searchTerms.length} terms...`);
  const docs = await searchDocuments({ terms: searchTerms, sinceDate: since });
  console.log(`[rfis] Got ${docs.length} unique candidate documents.`);

  const results: RFIT[] = [];
  for (const doc of docs) {
    const id = rfiId(doc);
    if (excludeIds.has(id)) continue;

    // We only keep docs that actually have a comment period — that's what
    // makes them RFIs for our purposes. (A notice without a close date is
    // a general announcement, not a participation opportunity.)
    if (!doc.comments_close_on && !includeIds.has(id)) continue;

    const decision = decideScope({
      id,
      title: doc.title,
      abstract: doc.abstract,
      overrideIncludeIds: includeIds,
      overrideExcludeIds: excludeIds,
      config,
    });
    if (!decision) continue;

    const docketId =
      doc.regulations_dot_gov_info?.docket_id ??
      (doc.docket_ids && doc.docket_ids[0]) ??
      null;

    const commentUrl =
      doc.regulations_dot_gov_info?.comments_url ??
      (docketId ? `https://www.regulations.gov/docket/${docketId}` : null);

    const record: RFIT = {
      id,
      type: 'rfi',
      title: doc.title,
      status: statusFor(doc),
      agency: agencyName(doc),
      docket_id: docketId,
      open_date: doc.publication_date ?? null,
      close_date: doc.comments_close_on ?? null,
      comment_submission_url: commentUrl,
      document_number: doc.document_number,
      document_type: doc.type ?? null,
      last_updated: doc.publication_date ?? nowIso(),
      source_url: doc.html_url,
      added_at: prevAddedAt.get(id) ?? nowIso(),
      scope_reason: decision.scope_reason,
      matched_keywords: decision.matched_keywords,
    };

    try {
      results.push(RFI.parse(record));
    } catch (err) {
      console.warn(`[rfis] Schema validation failed for ${id}: ${(err as Error).message}`);
    }
  }

  results.sort((a, b) => {
    // Open first, then by close date ascending; then closed by close date desc.
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1;
    if (a.status === 'open') return (a.close_date ?? '').localeCompare(b.close_date ?? '');
    return (b.close_date ?? '').localeCompare(a.close_date ?? '');
  });

  writeJson('data/rfis.json', results);
  console.log(`[rfis] Wrote ${results.length} RFIs to data/rfis.json.`);

  const meta: Meta = {
    last_sync: nowIso(),
    bills_count: prevMeta?.bills_count ?? 0,
    rfis_count: results.length,
    hearings_count: prevMeta?.hearings_count ?? 0,
    sync_sources: {
      bills: prevMeta?.sync_sources.bills ?? 'api.congress.gov',
      rfis: 'federalregister.gov',
      hearings: prevMeta?.sync_sources.hearings ?? 'api.congress.gov',
    },
  };
  writeJson('data/_meta.json', meta);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
