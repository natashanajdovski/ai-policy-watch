import type { ScopeConfig } from './config';

export type ScopeMatch = {
  matches: boolean;
  matchedKeywords: string[];
};

// Check whether a title/abstract/text string matches any keyword from the
// included list, while respecting the excluded-from-matching list.
//
// Special handling for "ai" as a standalone acronym: require word boundaries
// and alphabetic-character boundaries (so "MAIL" and "AIR" don't match).
export function matchKeywords(text: string | null | undefined, config: ScopeConfig): ScopeMatch {
  if (!text) return { matches: false, matchedKeywords: [] };
  const lower = text.toLowerCase();

  // If text contains only an excluded-from-matching phrase (and no included
  // term beyond it), we shouldn't match. The excluded list is advisory: it
  // reminds us not to add these terms to `included`, and it lets us skip
  // items that ONLY match on excluded phrases. In practice the decisive
  // gate is the `included` list — we simply don't put these terms in it.
  // We keep the list visible in config for documentation purposes.

  const matched: string[] = [];
  for (const keyword of config.keywords) {
    if (keyword === 'ai') {
      // Standalone acronym match: require non-letter boundaries on both sides.
      if (/(^|[^a-z])ai([^a-z]|$)/i.test(lower)) {
        matched.push('ai');
      }
    } else if (lower.includes(keyword)) {
      matched.push(keyword);
    }
  }
  return { matches: matched.length > 0, matchedKeywords: matched };
}

// Decide whether a document is in scope based on CRS subject tag, keyword
// match, or manual include override. Returns null if out of scope.
export function decideScope(args: {
  id: string;
  title: string;
  abstract?: string | null;
  crsSubjects?: string[];
  overrideIncludeIds: Set<string>;
  overrideExcludeIds: Set<string>;
  config: ScopeConfig;
}): { scope_reason: 'crs_tag' | 'keyword_match' | 'manual_include'; matched_keywords: string[] } | null {
  // Hard exclude wins.
  if (args.overrideExcludeIds.has(args.id)) return null;

  // CRS tag is the primary filter for bills.
  const hasCrsTag = args.crsSubjects?.some(
    (s) => s.toLowerCase() === 'artificial intelligence',
  );

  // Keyword match on title + abstract.
  const combinedText = [args.title, args.abstract].filter(Boolean).join(' \n ');
  const keywordMatch = matchKeywords(combinedText, args.config);

  // Manual include wins regardless of automatic filters.
  if (args.overrideIncludeIds.has(args.id)) {
    return { scope_reason: 'manual_include', matched_keywords: keywordMatch.matchedKeywords };
  }

  if (hasCrsTag) {
    return { scope_reason: 'crs_tag', matched_keywords: keywordMatch.matchedKeywords };
  }

  if (keywordMatch.matches) {
    return { scope_reason: 'keyword_match', matched_keywords: keywordMatch.matchedKeywords };
  }

  return null;
}
