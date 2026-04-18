# AI Policy Watch

**Live site:** [aipw.netlify.app](https://aipw.netlify.app)
**Status:** P0 / in-progress — built in the open.

A public-interest aggregator of current federal government activity related to
artificial intelligence: pending and resolved federal legislation, open and
closed Requests for Information, and upcoming and past congressional hearings.

The site links out to authoritative sources (Congress.gov, Federal Register,
Regulations.gov, C-SPAN). It does not host its own detail pages and does not
take a position on AI policy. See [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md) for
the full purpose, tone, and scope.

## How this works

The repo auto-deploys to Netlify. Every push to `main` triggers a rebuild of
the static site. A scheduled GitHub Action runs daily at 10:00 UTC
(~6 AM ET), fetches fresh data from Congress.gov and the Federal Register,
commits the updated JSON files in `data/`, and that commit triggers another
Netlify rebuild. The live site stays current without manual intervention.

You only need to run this project locally if you're **contributing to it** —
fixing a bug, proposing a scope change, adding a feature. Readers should
just visit the live site.

## Run locally (for contributors)

```bash
# 1. Install dependencies
npm install

# 2. Copy .env.example to .env and add your Congress.gov API key
cp .env.example .env
# (edit .env — get a key at https://api.congress.gov/sign-up/)

# 3. Pull the dataset
npm run sync:all

# 4. Run the site locally
npm run dev
```

## Repository layout

```
config/     Human-editable scope rules (keywords, include/exclude overrides)
data/       The synced dataset (JSON), committed to the repo
scripts/    Sync jobs and their shared library (one per content type)
src/        The Astro site (pages, components, styles)
.github/    CI and scheduled sync workflow
```

The separation is deliberate: a PR that adjusts the AI-scope keyword list
touches only `config/`; a PR that improves the Legislation surface touches
only `src/pages/legislation.astro` and `src/components/`; a PR that changes
how bills are fetched touches only `scripts/sync-bills.ts` and its library.

## Data sources

| Source            | What we pull                  | API key required |
|-------------------|-------------------------------|------------------|
| Congress.gov      | Federal bills and hearings    | Yes (free)       |
| Federal Register  | RFIs and public-input notices | No               |
| Regulations.gov   | Comment-submission docket URLs| Optional (free)  |

## Scripts

| Command                  | What it does                                        |
|--------------------------|-----------------------------------------------------|
| `npm run dev`            | Run the Astro site locally on port 4321             |
| `npm run build`          | Build static site into `dist/`                      |
| `npm run sync:bills`     | Pull and filter AI-related bills from Congress.gov  |
| `npm run sync:rfis`      | Pull and filter AI-related RFIs from Federal Register|
| `npm run sync:hearings`  | Pull and filter AI-related hearings from Congress.gov|
| `npm run sync:all`       | Run all three syncs in sequence                     |
| `npm run typecheck`      | Astro type-check                                    |

## Scope rules

The filter logic lives in `config/keywords.yml` (the deliberately conservative
keyword list from the brief's Appendix A) and two override files:
`config/include.yml` (force-include specific items) and `config/exclude.yml`
(force-exclude). All three are plain YAML and editable by PR; no code change
needed to tune the scope.

See [PRODUCT_BRIEF.md §7](./PRODUCT_BRIEF.md#7-data-architecture) for the
full rationale.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). V1 is a technical-contributor flow
(git + PR). A non-technical feedback path is planned for V1.1.

## Built with AI agent assistance

This project is maintained by a human (Natasha Najdovski) with substantial
help from AI coding agents — primarily Claude (Anthropic). Agents do much
of the day-to-day code, data review, and PR-response work under human
review. We disclose this because the mission of AI Policy Watch is to make
AI policy visible to the public; it would be inconsistent not to be
transparent about how an AI-adjacent tool is itself built.

Agent-assisted commits carry a `Co-Authored-By: Claude <noreply@anthropic.com>`
trailer, so authorship is inspectable in the git log. The rules agents
follow when acting in this repo live in [AGENTS.md](./AGENTS.md).

## Licenses

- **Code:** MIT — see [LICENSE](./LICENSE)
- **Dataset and site content:** CC BY 4.0 — see [CONTENT_LICENSE](./CONTENT_LICENSE)
