import 'dotenv/config';
import { loadConfig, buildOverrideSets, type ScopeConfig } from './lib/config';
import {
  listBills,
  getBillDetail,
  getBillSubjects,
  getBillActions,
  type ApiBillListItem,
  type ApiBillDetail,
  type ApiBillSubjects,
  type ApiBillAction,
} from './lib/congress-api';
import { decideScope, matchKeywords } from './lib/scope-filter';
import {
  billChamberFromType,
  billPublicUrl,
  computeBillStage,
  computeBillStatus,
} from './lib/bill-status';
import { readJson, writeJson, nowIso } from './lib/io';
import { Bill, type Bill as BillT, type Meta } from './lib/schema';

// Pull both the current Congress (in-progress bills) and the most-recently
// concluded Congress (every bill expired → "resolved" per brief §6). The
// concluded lookback is a fixed date; the current-Congress lookback is
// incremental from the previous sync timestamp.
const CURRENT_CONGRESS = 119;
const CONCLUDED_CONGRESSES = [118] as const;
const INITIAL_LOOKBACK_DAYS = 180;
const CONCLUDED_FROM_DATE_TIME = '2024-01-01T00:00:00Z';

function billId(congress: number, type: string, number: string): string {
  return `bill-${congress}-${type.toLowerCase()}${number}`;
}

function trimMillisZ(iso: string): string {
  return iso.replace(/\.\d{3}Z$/, 'Z');
}

async function syncCongress(args: {
  congress: number;
  fromDateTime: string;
  config: ScopeConfig;
  includeIds: Set<string>;
  excludeIds: Set<string>;
  prevAddedAt: Map<string, string>;
}): Promise<BillT[]> {
  const { congress, fromDateTime, config, includeIds, excludeIds, prevAddedAt } = args;

  console.log(
    `[bills] Congress ${congress}: fetching bills updated since ${fromDateTime}...`,
  );
  const raw = await listBills({ congress, fromDateTime });
  console.log(`[bills] Congress ${congress}: got ${raw.length} recent bills.`);

  // Title keyword match forms the candidate set. Subjects (CRS tag) are
  // fetched only for candidates to stay under the API budget.
  const candidates: ApiBillListItem[] = raw.filter((b) => {
    const id = billId(b.congress, b.type, b.number);
    if (excludeIds.has(id)) return false;
    if (includeIds.has(id)) return true;
    return matchKeywords(b.title, config).matches;
  });
  console.log(`[bills] Congress ${congress}: ${candidates.length} candidates after keyword match.`);

  const out: BillT[] = [];
  let processed = 0;
  for (const item of candidates) {
    processed += 1;
    const id = billId(item.congress, item.type, item.number);
    let detail: ApiBillDetail;
    let subjects: ApiBillSubjects;
    let actions: ApiBillAction[];
    try {
      detail = await getBillDetail({
        congress: item.congress,
        type: item.type,
        number: item.number,
      });
      subjects = await getBillSubjects({
        congress: item.congress,
        type: item.type,
        number: item.number,
      });
      actions = await getBillActions({
        congress: item.congress,
        type: item.type,
        number: item.number,
      });
    } catch (err) {
      console.warn(`[bills] Skipping ${id}: ${(err as Error).message}`);
      continue;
    }

    const crsSubjects = (subjects.legislativeSubjects ?? []).map((s) => s.name);
    const policyArea = subjects.policyArea?.name ?? detail.policyArea?.name ?? null;
    const decision = decideScope({
      id,
      title: item.title,
      crsSubjects,
      overrideIncludeIds: includeIds,
      overrideExcludeIds: excludeIds,
      config,
    });
    if (!decision) continue;

    const sponsor = (detail.sponsors ?? [])[0];
    const sponsorName =
      sponsor?.fullName ??
      [sponsor?.firstName, sponsor?.lastName].filter(Boolean).join(' ') ??
      null;

    const laws = detail.laws ?? [];
    const chamber = billChamberFromType(item.type);
    const latestActionText = detail.latestAction?.text ?? item.latestAction?.text ?? null;
    const record: BillT = {
      id,
      type: 'bill',
      title: item.title,
      status: computeBillStatus({
        currentCongress: CURRENT_CONGRESS,
        billCongress: item.congress,
        latestActionText,
        hasLaw: laws.length > 0,
      }),
      stage: computeBillStage({
        currentCongress: CURRENT_CONGRESS,
        billCongress: item.congress,
        originChamber: chamber,
        actionTexts: actions.map((a) => a.text ?? '').filter(Boolean),
        hasLaw: laws.length > 0,
      }),
      bill_number: `${item.type}.${item.number}`,
      chamber,
      congress: item.congress,
      sponsor: sponsor
        ? {
            name: sponsorName ?? 'Unknown',
            party: sponsor.party ?? null,
            state: sponsor.state ?? null,
            bioguide_id: sponsor.bioguideId ?? null,
          }
        : null,
      introduced_date: detail.introducedDate ?? null,
      last_action_date: detail.latestAction?.actionDate ?? item.latestAction?.actionDate ?? null,
      last_action_text: detail.latestAction?.text ?? item.latestAction?.text ?? null,
      committee: detail.committees?.items?.[0]?.name ?? null,
      cosponsors_count: detail.cosponsors?.count ?? null,
      policy_area: policyArea,
      last_updated:
        detail.updateDateIncludingText ??
        detail.updateDate ??
        item.updateDateIncludingText ??
        item.updateDate,
      source_url: billPublicUrl({
        congress: item.congress,
        type: item.type,
        number: item.number,
      }),
      added_at: prevAddedAt.get(id) ?? nowIso(),
      scope_reason: decision.scope_reason,
      matched_keywords: decision.matched_keywords,
    };

    try {
      out.push(Bill.parse(record));
    } catch (err) {
      console.warn(`[bills] Schema validation failed for ${id}: ${(err as Error).message}`);
    }

    if (processed % 25 === 0) {
      console.log(`[bills] Congress ${congress}:   …processed ${processed}/${candidates.length}`);
    }
  }

  return out;
}

async function main() {
  const config = loadConfig();
  const includeIds = buildOverrideSets(config.include).bills;
  const excludeIds = buildOverrideSets(config.exclude).bills;

  const prevMeta = readJson<Meta>('data/_meta.json');
  const prevBills = readJson<BillT[]>('data/bills.json') ?? [];
  const prevAddedAt = new Map(prevBills.map((b) => [b.id, b.added_at]));

  // Incremental lookback only when we actually have prior data to merge
  // against — otherwise a "prev meta but empty dataset" situation (e.g.,
  // data file deleted) would lose historical bills. When dataset is empty,
  // always use the full initial lookback.
  const currentLookbackMs = INITIAL_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const haveDataset = prevBills.length > 0;
  const currentFromDateTime = trimMillisZ(
    haveDataset && prevMeta?.last_sync
      ? new Date(
          Math.min(Date.parse(prevMeta.last_sync), Date.now() - 7 * 24 * 60 * 60 * 1000),
        ).toISOString()
      : new Date(Date.now() - currentLookbackMs).toISOString(),
  );

  const all: BillT[] = [];
  all.push(
    ...(await syncCongress({
      congress: CURRENT_CONGRESS,
      fromDateTime: currentFromDateTime,
      config,
      includeIds,
      excludeIds,
      prevAddedAt,
    })),
  );
  for (const c of CONCLUDED_CONGRESSES) {
    all.push(
      ...(await syncCongress({
        congress: c,
        fromDateTime: CONCLUDED_FROM_DATE_TIME,
        config,
        includeIds,
        excludeIds,
        prevAddedAt,
      })),
    );
  }

  // Carry forward any previously-known bills not touched this run — guards
  // against a narrow lookback accidentally dropping rows.
  const touchedIds = new Set(all.map((b) => b.id));
  for (const old of prevBills) {
    if (!touchedIds.has(old.id) && !excludeIds.has(old.id)) {
      all.push(old);
    }
  }

  // Sort: in-progress first (newest action first), then resolved (newest first).
  all.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'in_progress' ? -1 : 1;
    return (b.last_action_date ?? '').localeCompare(a.last_action_date ?? '');
  });

  writeJson('data/bills.json', all);
  console.log(`[bills] Wrote ${all.length} bills to data/bills.json.`);

  const meta: Meta = {
    last_sync: nowIso(),
    bills_count: all.length,
    rfis_count: prevMeta?.rfis_count ?? 0,
    hearings_count: prevMeta?.hearings_count ?? 0,
    sync_sources: {
      bills: 'api.congress.gov',
      rfis: prevMeta?.sync_sources.rfis ?? 'federalregister.gov',
      hearings: prevMeta?.sync_sources.hearings ?? 'api.congress.gov',
    },
  };
  writeJson('data/_meta.json', meta);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
