# Instructions for AI agents

This file is for AI coding agents (Claude, Cursor, Copilot, Devin, etc.)
acting in this repository. Read it fully before making changes.

Human contributors should read [CONTRIBUTING.md](./CONTRIBUTING.md)
instead; this file is a superset aimed at agents that have more context
and fewer social cues.

---

## What this project is

AI Policy Watch is a public-interest aggregator of federal government
activity related to artificial intelligence. It is non-partisan and
deliberately non-advocacy: the site presents information, the reader
decides. See [docs/PRODUCT_BRIEF.md](./docs/PRODUCT_BRIEF.md) for the full
authorial intent — read at least sections 1–5, 7, and 12 before making
non-trivial changes.

The tone is **librarian, not organizer**. Think Ballotpedia or a cleaned-up
federal agency site, not a startup landing page.

---

## Hard rules (never violate)

1. **Do not editorialize.** Describe bills, RFIs, and hearings in
   source-mirroring language. Words like "dangerous," "common-sense,"
   "pro-innovation," "anti-worker," "urgent," or "landmark" do not appear
   in the site copy, row titles, or any user-facing text.
2. **Do not add urgency.** No red banners, no countdown pulses, no
   "ACT NOW" framing, no alert states. Dates are neutral metadata. The
   palette is muted. See §10 of the brief.
3. **Do not commit secrets.** `.env` is gitignored; never add API keys,
   tokens, or credentials to any file that will be tracked. If you see
   a secret in a diff, remove it and flag to the maintainer.
4. **Do not expand scope without a human decision.** Federal-only is a
   deliberate v1 choice. State-level, international, non-AI tech policy,
   user accounts, email alerts, editorial summaries — all explicitly out
   of scope. See docs/PRODUCT_BRIEF.md §5.
5. **Do not delete or reinterpret the include/exclude override lists.**
   `config/include.yml` and `config/exclude.yml` are the human override
   layer. If you think an entry is wrong, raise it as an issue; don't
   silently remove it.

---

## Architecture rules

### Content-type isolation

Each content surface (Legislation, RFIs, Hearings) has its own page, its
own table component, and its own sync script. A PR that changes one
surface should not touch the other two. The repo is structured to make
this easy:

- Surface pages: `src/pages/{legislation,rfis,hearings}.astro`
- Surface components: `src/components/surface/{Bills,RFIs,Hearings}Table.astro`
- Sync scripts: `scripts/sync-{bills,rfis,hearings}.ts`

Shared components (Nav, Footer, PageShell, FilterControls, SurfaceHeader)
are infrastructure. Changes to them affect every surface, so they deserve
extra review.

### Schema is the contract

`scripts/lib/schema.ts` is the single source of truth for the data shape.
Types flow from there into both the sync scripts (which write data) and
the UI (which reads data). Never re-declare types for `Bill`, `RFI`,
`Hearing`, or `Meta` elsewhere — always import from schema.

If you need to extend the schema, update `schema.ts`, then update every
sync script that writes that type and every component that reads it. The
`tsc` check will catch the places you missed.

### Config-as-data

Scope decisions live in three YAML files that humans can edit:
- `config/keywords.yml` — the Appendix A keyword list
- `config/include.yml` — force-include specific items by ID
- `config/exclude.yml` — force-exclude specific items by ID

Never hardcode scope decisions in TS or Astro files. If a bill is being
incorrectly categorized, the fix is a config edit, not a code branch.

---

## Work conventions

### Before you propose a change

1. Run `npm run typecheck`. PRs that don't typecheck will be asked to fix.
2. If you're changing the sync layer, run the relevant `npm run sync:*`
   locally and eyeball the output for obviously broken data.
3. If you're adding a UI feature, run `npm run dev` and click through
   the surfaces to confirm nothing regressed.

### PR structure

- **One intent per PR.** A scope-list change and a UI fix are two PRs.
- **Use the PR template** (`.github/pull_request_template.md`). Fill in
  the isolation-check section honestly.
- **Keep the diff small.** Prefer several small PRs over one big one.

### Commit messages

Conventional style, e.g., `feat(legislation): add stage column`,
`fix(sync-bills): handle transient network errors`. When commits are
agent-assisted, include a `Co-Authored-By` trailer identifying the agent
(the maintainer will add this automatically if you don't).

### Code style

- TypeScript strict mode, no `any`. Narrow at boundaries (API response →
  schema-validated record).
- Astro components for UI. Keep logic minimal in `.astro` files; push
  non-trivial logic into `src/lib/` for reuse.
- Comments explain WHY, not WHAT. Well-named identifiers are self-documenting;
  add a comment only when a constraint or rationale would be surprising.

---

## Working with the data sources

All three sources are public and free:
- Congress.gov API — `scripts/lib/congress-api.ts`
- Federal Register API — `scripts/lib/federal-register.ts`
- Regulations.gov — currently accessed only via links embedded in Federal
  Register records; the optional API key enables richer RFI metadata

### Rate limits

Congress.gov: 5,000 requests/hour. The API client rate-limits to 1 req/sec
(well under the ceiling). Don't disable the throttle to speed things up
without a clear reason — the GitHub Actions sync runs daily, a few minutes
of runtime is fine.

### Transient errors

The Congress.gov client retries on socket errors, timeouts, and 5xx
responses with exponential backoff. If you're seeing repeated failures,
log and flag — don't paper over them.

### URL formats

Public URLs on Congress.gov differ from API URLs. The known formats:
- Bills: `https://www.congress.gov/bill/{congress}th-congress/{chamber}-bill/{number}`
- Hearings: `https://www.congress.gov/event/{congress}th-congress/{chamber}-event/{eventId}`

Both are computed in `scripts/lib/bill-status.ts` and `scripts/sync-hearings.ts`
respectively. If you need another kind of public URL, verify against a
browser-visited real URL before committing — Congress.gov blocks most
automated verification, so I trust the human maintainer's eye on this.

---

## What to do when you're uncertain

- **If a change feels like it expands scope:** open an issue first, don't
  draft a PR.
- **If you can't decide between two approaches:** write a short comment in
  an issue and wait for human direction.
- **If a test or typecheck fails and you can't see why:** report the error
  with the exact command and output, don't silently work around it.
- **If a rule in this file seems to conflict with the brief or CONTRIBUTING:**
  the brief wins. Raise the conflict as an issue and propose a fix.

---

## File-layout summary

```
config/           human-editable scope rules (YAML)
data/             the committed dataset (JSON)
scripts/          sync jobs + shared library
src/              Astro site (pages, components, lib, styles)
docs/             product documentation (PRODUCT_BRIEF.md, epics, ADRs)
.github/          issue templates, PR template, workflows, CODEOWNERS
CONTRIBUTING.md   contributor-facing guide
AGENTS.md         this file
```

---

*This file itself is a contribution target: if a rule here is wrong or
incomplete, propose the fix as a PR.*
