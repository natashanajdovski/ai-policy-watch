import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { z } from 'zod';
import { REPO_ROOT } from './io';

const KeywordsFile = z.object({
  included: z.array(z.string()).default([]),
  excluded_from_matching: z.array(z.string()).default([]),
});

const OverrideEntry = z.object({
  id: z.string(),
  reason: z.string(),
});

const OverrideFile = z.object({
  bills: z.array(OverrideEntry).default([]),
  rfis: z.array(OverrideEntry).default([]),
  hearings: z.array(OverrideEntry).default([]),
});

export type Overrides = z.infer<typeof OverrideFile>;

export type ScopeConfig = {
  keywords: string[];
  excludedFromMatching: string[];
  include: Overrides;
  exclude: Overrides;
};

function loadYaml<T>(relativePath: string, validator: z.ZodType<T>): T {
  const raw = readFileSync(join(REPO_ROOT, relativePath), 'utf-8');
  const parsed = yaml.load(raw);
  return validator.parse(parsed ?? {});
}

export function loadConfig(): ScopeConfig {
  const keywords = loadYaml('config/keywords.yml', KeywordsFile);
  const include = loadYaml('config/include.yml', OverrideFile);
  const exclude = loadYaml('config/exclude.yml', OverrideFile);
  return {
    keywords: (keywords.included ?? []).map((k) => k.toLowerCase()),
    excludedFromMatching: (keywords.excluded_from_matching ?? []).map((k) => k.toLowerCase()),
    include: {
      bills: include.bills ?? [],
      rfis: include.rfis ?? [],
      hearings: include.hearings ?? [],
    },
    exclude: {
      bills: exclude.bills ?? [],
      rfis: exclude.rfis ?? [],
      hearings: exclude.hearings ?? [],
    },
  };
}

export function buildOverrideSets(overrides: Overrides) {
  return {
    bills: new Set(overrides.bills.map((o) => o.id)),
    rfis: new Set(overrides.rfis.map((o) => o.id)),
    hearings: new Set(overrides.hearings.map((o) => o.id)),
  };
}
