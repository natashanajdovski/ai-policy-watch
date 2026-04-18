import type { BillStage, BillStatus } from './schema';

// Heuristic mapping from a bill's latest action text + congress to our
// two-state status. The brief defines:
//   in_progress: introduced but not yet enacted, failed, or expired
//   resolved:    enacted, died in committee, voted down, vetoed, or expired
//
// A bill in the CURRENT congress is "in_progress" unless its latest action
// shows a terminal state. A bill in a PAST congress is "resolved" (either
// enacted or expired at end of Congress).
//
// This is intentionally coarse — V1 may introduce sub-states.

const TERMINAL_PATTERNS = [
  /became public law/i,
  /became private law/i,
  /became law/i,
  /vetoed by president/i,
  /failed of passage/i,
  /motion to reconsider laid on the table/i, // often terminal on contested votes
  /withdrawn by sponsor/i,
  /passage objected to/i,
];

export function computeBillStatus(args: {
  currentCongress: number;
  billCongress: number;
  latestActionText: string | null | undefined;
  hasLaw?: boolean;
}): BillStatus {
  if (args.hasLaw) return 'resolved';
  if (args.billCongress < args.currentCongress) return 'resolved';
  const text = args.latestActionText ?? '';
  if (TERMINAL_PATTERNS.some((p) => p.test(text))) return 'resolved';
  return 'in_progress';
}

// Public Congress.gov URL for a bill, given congress + type + number.
// e.g., https://www.congress.gov/bill/119th-congress/house-bill/5388
const CHAMBER_PATH: Record<string, string> = {
  HR: 'house-bill',
  S: 'senate-bill',
  HJRES: 'house-joint-resolution',
  SJRES: 'senate-joint-resolution',
  HCONRES: 'house-concurrent-resolution',
  SCONRES: 'senate-concurrent-resolution',
  HRES: 'house-resolution',
  SRES: 'senate-resolution',
};

export function billPublicUrl(args: {
  congress: number;
  type: string;
  number: string;
}): string {
  const path = CHAMBER_PATH[args.type.toUpperCase()] ?? 'house-bill';
  const suffix = ordinalSuffix(args.congress);
  return `https://www.congress.gov/bill/${args.congress}${suffix}-congress/${path}/${args.number}`;
}

function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

export function billChamberFromType(type: string): 'house' | 'senate' {
  return type.toUpperCase().startsWith('H') ? 'house' : 'senate';
}

// Derive the legislative stage from the bill's actions history + law flag.
// This is Congress.gov's "tracker" equivalent: Introduced → Passed one
// chamber → Passed both → At President → Enacted. For resolved bills:
// Enacted, Vetoed, Expired, or Failed.
//
// Scanning all actions (not just the latest) is necessary because a bill
// that passed one chamber often has a subsequent committee-referral action
// as its latest entry. The PRESENCE of a "Passed House" action anywhere in
// history is what indicates the bill advanced, regardless of what came
// after.
export function computeBillStage(args: {
  currentCongress: number;
  billCongress: number;
  originChamber: 'house' | 'senate';
  actionTexts: string[];
  hasLaw: boolean;
}): BillStage {
  if (args.hasLaw) return 'enacted';

  const all = args.actionTexts.join(' ').toLowerCase();
  const anyMatch = (re: RegExp) => re.test(all);
  const anyIncludes = (s: string) => all.includes(s);

  if (anyIncludes('became public law') || anyIncludes('became private law')) return 'enacted';
  if (anyIncludes('vetoed by president') || anyMatch(/(^| )vetoed( |$|\.)/)) return 'vetoed';
  if (anyIncludes('failed of passage')) return 'failed';
  if (anyIncludes('presented to president')) return 'at_president';

  // Chamber-passage signals — either explicit ("Passed House"/"Passed
  // Senate") or the handoff phrases indicating the bill crossed chambers.
  const passedHouse =
    anyMatch(/(passed|agreed to) (in )?(the )?house/) ||
    anyIncludes('passed house') ||
    anyIncludes('received in the senate'); // bill handoff: House → Senate
  const passedSenate =
    anyMatch(/(passed|agreed to) (in )?(the )?senate/) ||
    anyIncludes('passed senate') ||
    anyIncludes('received in the house'); // bill handoff: Senate → House

  if (passedHouse && passedSenate) return 'passed_both_chambers';
  if (passedHouse) {
    return args.originChamber === 'senate' ? 'passed_both_chambers' : 'passed_house';
  }
  if (passedSenate) {
    return args.originChamber === 'house' ? 'passed_both_chambers' : 'passed_senate';
  }

  // Concluded Congress + no advancement = expired.
  if (args.billCongress < args.currentCongress) return 'expired';

  return 'introduced';
}

// Human-facing label for a stage, incorporating chamber where relevant.
const STAGE_LABELS: Record<BillStage, string> = {
  introduced: 'Introduced',
  passed_house: 'Passed House',
  passed_senate: 'Passed Senate',
  passed_both_chambers: 'Passed both chambers',
  at_president: 'At the President',
  enacted: 'Enacted',
  vetoed: 'Vetoed',
  failed: 'Failed',
  expired: 'Expired',
};

export function stageLabel(stage: BillStage | null): string {
  if (!stage) return 'Status unknown';
  return STAGE_LABELS[stage];
}
