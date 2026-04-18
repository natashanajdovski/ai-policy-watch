# Contributing to AI Policy Watch

**Live site:** [aipw.netlify.app](https://aipw.netlify.app)

Thanks for your interest in contributing. This project is public-interest
infrastructure, and the whole point is that other people can shape it.

This guide is aimed at a technical audience (comfortable with git, GitHub,
and Node.js). A non-technical feedback path — in-site forms that open issues
or draft PRs — is planned for V1.1.

## What we welcome

High-signal contributions, in rough priority order:

1. **Scope corrections.** A bill, RFI, or hearing that should be in the
   dataset but isn't — or shouldn't be but is. File an issue with the
   source URL and a one-line reason, or open a PR adjusting
   `config/include.yml` or `config/exclude.yml`.
2. **Keyword list proposals.** Add or remove a term in `config/keywords.yml`
   with a short rationale in the PR description.
3. **Content corrections.** Typos, unclear language, or inaccuracies in the
   FAQ/About page.
4. **Code improvements.** Bug fixes, better error handling, performance.
5. **Accessibility fixes.** A11y issues are treated as bugs.

## What we're cautious about

- Editorializing. This site is deliberately non-partisan. Contributions that
  frame bills as "pro-" or "anti-" something will be asked to use
  source-mirroring language instead.
- Scope expansion beyond federal AI policy. State-level is deferred to V2;
  international is deferred indefinitely; non-AI tech policy is out of scope.
- New features that add complexity. V1 intentionally ships without detail
  pages, user accounts, or saved searches. See the brief's "out of scope" list.

When in doubt, open an issue first.

## Filing issues

Use one of our [issue templates](https://github.com/natashanajdovski/ai-policy-watch/issues/new/choose) — they're pre-routed by type and auto-label correctly:

- **Data correction** — a bill, RFI, or hearing is wrong, missing, or mis-included
- **Scope proposal** — add or remove a term in `config/keywords.yml`
- **Bug report** — something on the site or in a sync is broken
- **Feature request** — a new capability, check the roadmap phase before filing

Blank issues are disabled. Pick the template closest to your report.

## Setup

```bash
git clone https://github.com/natashanajdovski/ai-policy-watch.git
cd ai-policy-watch
npm install
cp .env.example .env  # then add your Congress.gov API key
npm run sync:all      # pull the dataset
npm run dev           # run locally
```

Requires Node.js 20+.

## Repo layout and where to make changes

| Change you want to make           | Files to touch                         |
|-----------------------------------|----------------------------------------|
| Adjust the AI scope keyword list  | `config/keywords.yml`                  |
| Force-include / force-exclude an item | `config/include.yml`, `config/exclude.yml` |
| Fix how bills are fetched/filtered| `scripts/sync-bills.ts`, `scripts/lib/` |
| Fix the Legislation page UI       | `src/pages/legislation.astro`, `src/components/` |
| Change site-wide design tokens    | `src/styles/tokens.css`                |
| Update the data schema            | `scripts/lib/schema.ts` (affects sync + site) |
| Edit FAQ / About copy             | `src/pages/about.astro`                |

## PR etiquette

- One intent per PR. A scope-list change and a UI fix should be two PRs.
- Include a rationale in the PR description, especially for scope changes.
  For keyword additions: one sentence on why the term is AI-specific enough
  to include without capturing false positives.
- For data corrections, link the authoritative source (Congress.gov,
  Federal Register, etc.).
- Run `npm run typecheck` before opening the PR.
- Small PRs get reviewed faster than large ones.

## Style

- TypeScript for scripts. Strict mode. Types come from `schema.ts` — don't
  duplicate them.
- Astro components for UI. Keep logic minimal in `.astro` files; push
  non-trivial logic into `src/lib/`.
- No `any`. Narrow at the boundary (API response → schema-validated record).

## Maintainer model

V1: Natasha Najdovski is sole maintainer. All PRs and issues come through
one queue. Co-maintainers will be recruited once the repo has traction — if
that's something you'd like to help with, say so on an issue.

## Code of conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). In short: good faith, stay on
the work, non-partisan framing. The civic-engagement mission of this project
requires contributors of different political views to collaborate here; the
code of conduct is how we keep that possible.

## AI agents are part of the maintainer workflow

AI coding agents (primarily Claude) help write and review code in this
repo, under human review by the maintainer. If you're a human contributor,
this doesn't change how you work — submit issues and PRs normally. If
you're an AI agent acting in this repo (on behalf of any user), read
[AGENTS.md](AGENTS.md) before making changes.
