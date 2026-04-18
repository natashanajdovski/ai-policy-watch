# Product documentation

This folder holds the product-side writing for AI Policy Watch — the
stuff that explains *what* we're building and *why*, as distinct from the
code in `src/` and `scripts/` which is *how* we're building it.

## What goes here

| Document | Purpose |
|---|---|
| [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md) | The foundation document. Mission, tone, scope, non-goals, roadmap. Read this first if you're new to the project. |
| `epics/` (future) | One document per major feature: user need, scope, design decisions, acceptance criteria. Created as we take on new epics. |
| `decisions/` (future) | Architecture Decision Records — short write-ups for significant technical or product choices and the reasoning behind them. |

## When to add a file here vs. somewhere else

- **Product intent or scope** → here
- **Feature spec (what we're building and why)** → here, under `epics/`
- **Code documentation (how it works)** → comments in the code itself, or `README.md` files next to the code
- **Contributor process** → [`CONTRIBUTING.md`](../CONTRIBUTING.md) at the root, not here
- **AI agent rules** → [`AGENTS.md`](../AGENTS.md) at the root, not here

## Editing protocol

Documents in this folder are living documents. Propose changes via pull
request the same way you'd propose a code change. For anything that
substantively modifies [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md), include a
clear rationale — that file is the site's north star, and drift in what
it says should be intentional and visible in the git history.
