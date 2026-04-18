import { z } from 'zod';

export const ScopeReason = z.enum(['crs_tag', 'keyword_match', 'manual_include']);
export type ScopeReason = z.infer<typeof ScopeReason>;

const BaseEntry = z.object({
  id: z.string(),
  title: z.string(),
  last_updated: z.string(),
  source_url: z.string().url(),
  added_at: z.string(),
  scope_reason: ScopeReason,
  matched_keywords: z.array(z.string()).default([]),
});

export const BillStatus = z.enum(['in_progress', 'resolved']);
export type BillStatus = z.infer<typeof BillStatus>;

// Granular progress labels, derived from the bill's latest action text and
// outcome. Used as the display chip on the legislation table — the
// top-level `status` (in_progress | resolved) is kept for filtering only.
export const BillStage = z.enum([
  'introduced',
  'passed_house',
  'passed_senate',
  'passed_both_chambers',
  'at_president',
  'enacted',
  'vetoed',
  'failed',
  'expired',
]);
export type BillStage = z.infer<typeof BillStage>;

export const Bill = BaseEntry.extend({
  type: z.literal('bill'),
  status: BillStatus,
  stage: BillStage.nullable().default(null),
  bill_number: z.string(),
  chamber: z.enum(['house', 'senate']),
  congress: z.number(),
  sponsor: z
    .object({
      name: z.string(),
      party: z.string().nullable(),
      state: z.string().nullable(),
      bioguide_id: z.string().nullable(),
    })
    .nullable(),
  introduced_date: z.string().nullable(),
  last_action_date: z.string().nullable(),
  last_action_text: z.string().nullable(),
  committee: z.string().nullable(),
  cosponsors_count: z.number().nullable(),
  policy_area: z.string().nullable(),
});
export type Bill = z.infer<typeof Bill>;

export const RFIStatus = z.enum(['open', 'closed']);
export type RFIStatus = z.infer<typeof RFIStatus>;

export const RFI = BaseEntry.extend({
  type: z.literal('rfi'),
  status: RFIStatus,
  agency: z.string(),
  docket_id: z.string().nullable(),
  open_date: z.string().nullable(),
  close_date: z.string().nullable(),
  comment_submission_url: z.string().nullable(),
  document_number: z.string(),
  document_type: z.string().nullable(),
});
export type RFI = z.infer<typeof RFI>;

export const HearingStatus = z.enum(['upcoming', 'past']);
export type HearingStatus = z.infer<typeof HearingStatus>;

export const Hearing = BaseEntry.extend({
  type: z.literal('hearing'),
  status: HearingStatus,
  committee: z.string(),
  chamber: z.enum(['house', 'senate', 'joint']),
  date_time: z.string().nullable(),
  location: z.string().nullable(),
  witnesses: z.array(z.string()).default([]),
  cspan_url: z.string().url().nullable(),
  event_id: z.string(),
});
export type Hearing = z.infer<typeof Hearing>;

export const Meta = z.object({
  last_sync: z.string(),
  bills_count: z.number(),
  rfis_count: z.number(),
  hearings_count: z.number(),
  sync_sources: z.object({
    bills: z.string(),
    rfis: z.string(),
    hearings: z.string(),
  }),
});
export type Meta = z.infer<typeof Meta>;

export type Entry = Bill | RFI | Hearing;
