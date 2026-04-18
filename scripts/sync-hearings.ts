import 'dotenv/config';
import { loadConfig, buildOverrideSets } from './lib/config';
import {
  listCommitteeMeetings,
  getCommitteeMeeting,
  type ApiCommitteeMeetingDetail,
} from './lib/congress-api';
import { decideScope, matchKeywords } from './lib/scope-filter';
import { readJson, writeJson, nowIso } from './lib/io';
import { Hearing, type Hearing as HearingT, type Meta } from './lib/schema';

const CURRENT_CONGRESS = 119;

// Hearings pipeline:
//   1. List committee meetings for both chambers (list items lack titles).
//   2. Fetch detail for each to get the title, committees, and date. We cap
//      the fetch budget so we don't hammer the API — adjust UPCOMING_MAX
//      and PAST_MAX once we see real volume.
//   3. Keyword-match on title and committee name.
//
// Known P0 limitation: the Congress.gov API's hearings coverage is
// incomplete — individual committees publish their own schedules and not
// all appear here. This is flagged on the Hearings page.

const UPCOMING_MAX = 300;
const PAST_MAX = 300;

function hearingId(eventId: string): string {
  return `hearing-${CURRENT_CONGRESS}-${eventId}`;
}

function chamberKey(raw: string | undefined): 'house' | 'senate' | 'joint' {
  const v = (raw ?? '').toLowerCase();
  if (v.includes('house')) return 'house';
  if (v.includes('senate')) return 'senate';
  return 'joint';
}

function meetingTitle(detail: ApiCommitteeMeetingDetail): string {
  // API responses sometimes store the title under `title`, sometimes under
  // `meetingTitle`, sometimes as a combination of type + committee. Try the
  // obvious fields and fall back to a synthesized label.
  const fields = (detail as Record<string, unknown>);
  const titleCandidates = [
    fields.title,
    fields.meetingTitle,
    fields.name,
  ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  if (titleCandidates.length > 0) return titleCandidates[0];

  const committeeName = detail.committees?.[0]?.name;
  const type = detail.type ?? 'Meeting';
  return committeeName ? `${committeeName} ${type}` : `Committee ${type}`;
}

function buildLocation(detail: ApiCommitteeMeetingDetail): string | null {
  const loc = detail.location;
  if (!loc) return null;
  return [loc.room, loc.building, loc.address].filter(Boolean).join(', ') || null;
}

function meetingStatusFromDate(dateStr: string | undefined): 'upcoming' | 'past' {
  if (!dateStr) return 'past';
  const d = Date.parse(dateStr);
  if (Number.isNaN(d)) return 'past';
  return d >= Date.now() ? 'upcoming' : 'past';
}

function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

function sourceUrl(congress: number, chamber: 'house' | 'senate' | 'joint', eventId: string): string {
  // Congress.gov public URL format, verified by hand:
  //   https://www.congress.gov/event/119th-congress/house-event/119195
  // The API URL format (/v3/committee-meeting/...) does NOT share this path.
  const ch = chamber === 'senate' ? 'senate' : 'house';
  return `https://www.congress.gov/event/${congress}${ordinalSuffix(congress)}-congress/${ch}-event/${eventId}`;
}

async function collectChamber(chamber: 'house' | 'senate') {
  const list = await listCommitteeMeetings({ congress: CURRENT_CONGRESS, chamber, maxResults: UPCOMING_MAX + PAST_MAX });
  console.log(`[hearings] ${chamber}: ${list.length} meetings listed.`);
  return list;
}

async function main() {
  const config = loadConfig();
  const includeIds = buildOverrideSets(config.include).hearings;
  const excludeIds = buildOverrideSets(config.exclude).hearings;

  const prev = readJson<HearingT[]>('data/hearings.json') ?? [];
  const prevAddedAt = new Map(prev.map((h) => [h.id, h.added_at]));
  const prevMeta = readJson<Meta>('data/_meta.json');

  console.log('[hearings] Listing committee meetings (House + Senate)...');
  const [house, senate] = await Promise.all([collectChamber('house'), collectChamber('senate')]);
  const all = [...house, ...senate];

  const results: HearingT[] = [];
  let processed = 0;
  for (const item of all) {
    processed += 1;
    const id = hearingId(item.eventId);
    if (excludeIds.has(id)) continue;

    let detail: ApiCommitteeMeetingDetail;
    try {
      detail = await getCommitteeMeeting({
        congress: item.congress,
        chamber: chamberKey(item.chamber) === 'senate' ? 'senate' : 'house',
        eventId: item.eventId,
      });
    } catch (err) {
      console.warn(`[hearings] Skipping ${id}: ${(err as Error).message}`);
      continue;
    }

    const title = meetingTitle(detail);
    const committee = detail.committees?.[0]?.name ?? 'Unknown committee';
    const searchable = `${title} ${committee}`;
    const kwMatch = matchKeywords(searchable, config);

    // Force-include wins even without a keyword match.
    if (!kwMatch.matches && !includeIds.has(id)) continue;

    const decision = decideScope({
      id,
      title: searchable,
      overrideIncludeIds: includeIds,
      overrideExcludeIds: excludeIds,
      config,
    });
    if (!decision) continue;

    const chamber = chamberKey(detail.chamber ?? item.chamber);
    const status = meetingStatusFromDate(detail.date);

    const cspanVideo = (detail.videos ?? []).find((v) =>
      (v.url ?? '').toLowerCase().includes('c-span.org'),
    );

    const record: HearingT = {
      id,
      type: 'hearing',
      title,
      status,
      committee,
      chamber,
      date_time: detail.date ?? null,
      location: buildLocation(detail),
      witnesses: (detail.witnesses ?? [])
        .map((w) => [w.name, w.organization].filter(Boolean).join(', '))
        .filter(Boolean),
      cspan_url: cspanVideo?.url ?? null,
      event_id: item.eventId,
      last_updated: item.updateDate,
      source_url: sourceUrl(item.congress, chamber, item.eventId),
      added_at: prevAddedAt.get(id) ?? nowIso(),
      scope_reason: decision.scope_reason,
      matched_keywords: decision.matched_keywords,
    };

    try {
      results.push(Hearing.parse(record));
    } catch (err) {
      console.warn(`[hearings] Schema validation failed for ${id}: ${(err as Error).message}`);
    }

    if (processed % 50 === 0) {
      console.log(`[hearings]   …processed ${processed}/${all.length}`);
    }
  }

  results.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'upcoming' ? -1 : 1;
    const aDate = a.date_time ?? '';
    const bDate = b.date_time ?? '';
    return a.status === 'upcoming' ? aDate.localeCompare(bDate) : bDate.localeCompare(aDate);
  });

  writeJson('data/hearings.json', results);
  console.log(`[hearings] Wrote ${results.length} hearings to data/hearings.json.`);

  const meta: Meta = {
    last_sync: nowIso(),
    bills_count: prevMeta?.bills_count ?? 0,
    rfis_count: prevMeta?.rfis_count ?? 0,
    hearings_count: results.length,
    sync_sources: {
      bills: prevMeta?.sync_sources.bills ?? 'api.congress.gov',
      rfis: prevMeta?.sync_sources.rfis ?? 'federalregister.gov',
      hearings: 'api.congress.gov',
    },
  };
  writeJson('data/_meta.json', meta);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
