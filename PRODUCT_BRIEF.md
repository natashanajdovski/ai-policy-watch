# AI Policy Watch — Product Brief

**Version:** 0.1 (working draft)
**Date:** April 17, 2026
**Owner:** Natasha Najdovski
**Status:** Foundation document for initial build. Intended to live in the project repository once created, and to evolve as the product evolves.

---

## 1. Overview

AI Policy Watch is a public-interest website that aggregates and surfaces current federal government activity related to artificial intelligence. It tracks three categories of activity: pending and resolved federal AI legislation, open and closed federal Requests for Information (RFIs), and upcoming and past congressional hearings. The site links directly to authoritative sources (Congress.gov, Federal Register, Regulations.gov, C-SPAN) rather than hosting its own detail pages.

The purpose of the site is to lower the barrier between "AI is being regulated by the federal government" and "a member of the public can see what's happening, form a view, and participate in the process if they choose to."

---

## 2. Problem and Motivation

Most Americans do not know what their government is actively deciding about AI. Existing trackers are built for lawyers and compliance professionals (MultiState, IAPP, Steptoe, various law firm trackers) or for academic reference (NCSL, Brennan Center). They answer the question "what is the law?" None of them answer the question "what can I, as a member of the public, do about this?"

The result is a widespread feeling that AI is happening *to* people rather than being shaped *with* them. This is a civic engagement gap, not a compliance gap.

AI Policy Watch is built to serve that gap by providing a calm, accessible, non-partisan view of federal AI policy activity, with the public comment and hearing process made visible without being pressed upon the visitor.

---

## 3. Target Audience and Tone Principles

### Primary audience

Curious, civically engaged members of the general public. People who read the news but don't follow legislative process for a living. People who feel they should know what's happening with AI policy but find existing resources too dense, too expensive, or too advocacy-focused to stay with.

Secondary audiences: policy researchers, journalists, academics, engaged citizens. Explicitly *not* lawyers or compliance officers, who already have dedicated tools.

### Tone principles

**Librarian, not organizer.** The site informs. It does not advocate. No red banners, no urgency flashing, no "ACT NOW" framing. If something is time-sensitive, the date is visible but presented the way a train schedule presents departure times.

**Non-partisan by construction.** Bill descriptions state what the legislation would do in plain language. No "pro-innovation" or "anti-worker" editorializing. Framing mirrors the source language wherever possible.

**Explanatory, not technical.** Written for someone who doesn't know what a committee markup is. Jargon is defined the first time it appears.

**Public utility aesthetic.** Serif typography for body text, clean sans-serif for metadata, substantial whitespace, muted palette, no marketing tone. Reads like Ballotpedia or a cleaned-up federal agency site, not a startup landing page.

**Action is available, not required.** The public comment process and how to weigh in on hearings is surfaced, but never as the loudest element. Participation is framed as informed citizenship, not activism. The site welcomes people who do not yet consider themselves activists.

---

## 4. Competitive Landscape

Existing AI policy trackers fall into three groups.

**Enterprise and paid trackers.** MultiState.ai (1,500+ state AI bills tracked in the 2026 session alone), IAPP US State AI Governance Tracker, Steptoe, Loeb & Loeb, BCLP, Ropes & Gray, Wiley. Comprehensive, paywalled or gated, built for lawyers and government affairs professionals.

**Academic and nonprofit trackers.** NCSL's Artificial Intelligence Legislation Database (50-state, monthly update), Brennan Center's federal bills tracker, Stanford HAI policy resources. Free and respected, but reference-oriented. They answer "what is the law?" not "how can the public engage?"

**Open source trackers.** fairlyAI's regulation policy tracker (global focus, shallow US), EthicalML's awesome list (link library), MAIR (academic monitoring). Either non-US-focused or purely reference with no action layer.

### The AI Policy Watch wedge

The first public-facing, non-partisan, action-aware tracker focused on federal AI policy with explicit transparency about scope and open contribution. The unique v1 positioning is "pending and actionable," with a committed roadmap toward editorial context, public comment aids, and community-requested tracking.

---

## 5. V1 Scope

### In scope

- Federal-only coverage (all 50 states explicitly deferred to V2)
- Three content surfaces: Legislation, RFIs, Hearings
- Auto-synced data from Congress.gov API and Federal Register API
- List view per surface with search, filter, and sort by recency
- Direct links to authoritative source material (no detail pages on the site itself)
- FAQ / About page covering mission, scope rules, contribution guide, and GitHub link
- Public GitHub repository with CONTRIBUTING.md geared toward a technical audience

### Out of scope

- State-level coverage
- International coverage
- Detail pages for individual bills, RFIs, or hearings
- Editorial plain-language summaries written by the site (deferred to V2)
- Public comment templates or letter drafting (deferred to V3)
- "Your representatives" personalization (deferred to V3)
- User accounts, saved searches, or email alerts
- In-site feedback forms that auto-create GitHub issues or PRs (scheduled for V1.1)
- Calendar integration (deferred to V3)
- Analysis of existing RFI comments (deferred to V3)

### Explicit non-goals

- Taking a position on AI policy. The site presents information; the reader decides.
- Replacing enterprise trackers. No attempt to serve compliance or legal teams.
- Exhaustive historical coverage. Focus is on current and recent federal activity.

---

## 6. Functional Requirements (V1)

### Navigation

Top-level navigation has three surfaces (Legislation, RFIs, Hearings) plus an About/FAQ link. No login, no user account, no settings.

### Legislation surface

**Purpose.** Show federal bills related to AI, organized by whether they can still be influenced or have been resolved.

**Status structure.** "In Progress" (introduced but not yet enacted, failed, or expired) and "Resolved" (enacted, died in committee, voted down, vetoed, or expired at end of Congress).

**Row contents.**
- Bill number (for example, H.R. 5388 or S. 3205)
- Short title
- Current status label
- Last action date
- Primary sponsor
- Direct link to the Congress.gov page for the bill

**Sort.** By most recent legislative action, newest first. User can toggle to sort by introduction date.

**Filter and search.** Free-text search across title and bill number. Filters for chamber (House / Senate), sponsor party, committee of referral, and status.

### RFIs surface

**Purpose.** Show federal Requests for Information, Requests for Comments, and similar public input opportunities where AI is the subject.

**Status structure.** "Open" (accepting comments) and "Closed" (comment period ended).

**Row contents.**
- Title of the RFI
- Publishing agency
- Open date
- Close date
- Days remaining (computed; displayed as neutral metadata)
- Direct link to the Federal Register notice
- Direct link to the Regulations.gov docket for comment submission, where available

**Sort.** Open RFIs by soonest close date. Closed RFIs by most recent close date.

**Filter and search.** Free-text search across title. Filter by agency.

### Hearings surface

**Purpose.** Show congressional hearings and committee meetings where AI is a scheduled topic.

**Status structure.** "Upcoming" and "Past."

**Row contents.**
- Committee name
- Hearing title or topic
- Date and time
- Location (virtual or in-person)
- Direct link to the Congress.gov hearing page
- Direct link to C-SPAN coverage where available

**Sort.** Upcoming by soonest date. Past by most recent date.

**Filter and search.** Free-text search. Filter by committee and by chamber.

### About / FAQ page

Required content:

- One-paragraph mission statement
- "What this site tracks" in plain language
- "How we decide what counts as an AI bill" (the filter logic, stated clearly)
- "What this site doesn't do" (explicit non-goals)
- "How to contribute" with GitHub link and contributor expectations
- "Who runs this" (maintainer note)
- "How often data updates" (refresh cadence)
- "How to give feedback" (issue link, contact method)

This page is the trust hook for the whole site. It carries the editorial weight that the rest of V1 deliberately avoids.

### No detail pages

Clicking any row opens the authoritative source in a new tab (Congress.gov, Federal Register, Regulations.gov, C-SPAN). AI Policy Watch does not host individual entry pages in V1.

---

## 7. Data Architecture

### Primary sources

- **Congress.gov API** (api.congress.gov) — federal bills, committee meetings, hearings
- **Federal Register API** (federalregister.gov) — RFIs and other public input notices
- **Regulations.gov API** (regulations.gov) — associated dockets and comment submission links

All three APIs are free, public, and require only basic API key registration.

### Scope filter logic

A bill or document is included in AI Policy Watch if *either* of the following applies.

**Primary filter (bills only):** the bill carries the Congressional Research Service "Artificial Intelligence" subject tag. This is a controlled-vocabulary classification maintained by Library of Congress librarians. If CRS tags a bill as AI-related, we include it. No further judgment needed.

**Secondary filter (fallback for bills without the CRS tag, and the only filter available for RFIs and hearings):** the title or abstract contains any keyword from the Initial Scope Keyword List in Appendix A. The list is deliberately conservative (err on exclusion).

**Human override layer:** an include-list and exclude-list stored in the repository allows manual correction of edge cases. Both lists are public and contribution-friendly.

The rule can be stated simply on the FAQ page: "Our scope is what the Library of Congress itself classifies as AI legislation, plus a small, visible set of adjacent terms. When in doubt, we exclude rather than include."

### Refresh cadence

**Deferred decision.** Candidates include daily sync via GitHub Actions, twice-daily sync, or on-demand with a manual trigger. Likely starting point: daily at a fixed time, tunable as we see API rate limits and hosting behavior in practice.

### Data storage

Raw API responses are transformed into a normalized schema (one record per bill, RFI, or hearing) and stored as JSON or YAML files in the repository, committed by the sync job. This makes the dataset version-controlled, inspectable, and forkable by contributors. See Appendix B for the schema sketch.

---

## 8. Contribution Model

### Tier 1: Standard GitHub flow (V1)

Audience: contributors comfortable with git and pull requests.

Contribution surfaces:
- Corrections to the FAQ and About content
- Proposals to adjust the scope keyword list (add or remove a term, with rationale)
- Improvements to CONTRIBUTING.md
- Bug fixes and code improvements
- Issue filing for data errors, missing items, or mis-included items

Expectations are documented in a CONTRIBUTING.md that covers repo setup, PR etiquette, scope criteria, and code style. Aimed at a technical audience from day one.

### Tier 2: In-site feedback (V1.1, fast-follow)

Audience: non-technical users (policy people, curious citizens) who want to contribute but do not use GitHub directly.

Product: small in-site feedback forms that translate submissions into GitHub issues or draft PRs via a backend integration. Multiple ingress points planned:

- A general "Feedback" link in the footer and on the FAQ page
- A "Flag this bill" link on each Legislation row
- A "Suggest a hearing" link on the Hearings surface
- A structured "Suggest a bill" form supporting the V3 community scope-request feature

### Maintainer model

V1: Natasha Najdovski as sole maintainer and reviewer. All PRs and issues come through her queue.

Fast-follow: recruit one or two co-maintainers once the repo is public and has some initial traction. This keeps review load sustainable and guards against single-point maintenance risk.

---

## 9. Roadmap

### V1 — the build described in this brief

Federal-only aggregator. Three surfaces. Auto-synced data. Direct links out. FAQ with scope transparency. Public GitHub with CONTRIBUTING. No editorial layer yet.

### V1.1 — fast-follow

- In-site feedback forms that auto-create GitHub issues or draft PRs
- Multiple ingress points for feedback
- Basic anonymous analytics to see which entries get clicked

### V2 — planned

- Plain-language summaries added to list rows (the editorial layer begins, written by maintainers and contributors)
- State-level coverage starts (seed from NCSL AI legislation database, state filter activated)
- An aggregated "What's upcoming" view across all three surfaces
- Optional email digest subscription (opt-in only, low cadence)

### V3 — aspirational

- Community suggest-a-bill with rationale; maintainer review adjusts scope rules in real time, closing the feedback loop
- Letter drafting aid for public comments on open RFIs
- Calendar integration for upcoming hearings (add to calendar, subscribe to C-SPAN schedule)
- Analysis of public comments already submitted on an open RFI (this is the feature most distinct from everything else in the market)
- "Your representatives" layer connecting bills to the user's own senators and House members

---

## 10. Design Principles in UX

Derived from the tone principles in Section 3.

- Dates and deadlines appear as neutral metadata, not urgent badges.
- Color palette is muted. No red, no alert states, no campaign-style calls to action.
- Typography: serif for body content, clean sans-serif for metadata.
- Substantial whitespace. Rows should be legible at a glance without visual noise.
- Every surface has a short "how this surface works" note near the top, available but not insistent.
- Every row shows its source. Nothing is surfaced without attribution.
- Search is prominent on every surface. Filters are secondary but always present.
- The only persistent chrome is navigation, footer (with GitHub link and feedback), and the scope-transparency link. No marketing modals. No popups.

---

## 11. Success Criteria (Draft)

**Deferred decision.** Proposed metrics for initial consideration:

- Weekly unique visitors as an awareness signal
- Clickthrough rate to authoritative sources (is the site driving traffic to Congress.gov and Federal Register?)
- RFI clickthroughs during open comment periods (is the site supporting participation?)
- GitHub stars, forks, and first-time contributors (is a community forming?)
- Issues filed via in-site feedback after V1.1 ships
- Time-to-update for newly introduced AI bills (data freshness)

Success should be measured by what the site enables for users, not by pure traffic. A smaller, engaged audience that actually submits comments during RFI windows is a better outcome than a larger passive readership.

---

## 12. Open Decisions and Deferred Choices

The following decisions have been deliberately deferred and should be resolved during the initial build or shortly after.

1. **Tech stack.** Netlify deployment is assumed, matching existing infrastructure. Framework choice between Astro (content-heavy static site, lowest build complexity), Next.js (more dynamic if we need it later), or plain HTML/JS is open. Current recommendation: Astro, for the content-heavy aggregator pattern.

2. **Refresh cadence.** Likely daily via GitHub Actions to start, tunable based on API rate limits.

3. **Homepage treatment.** What appears above the fold on the landing page. Whether there is a short intro paragraph explaining the site's purpose, or whether the homepage leads directly with content. Whether to feature a "what's closing soon" or "most recent updates" strip.

4. **Color palette and typography.** Specific choices within the public utility direction.

5. **Repository name and GitHub organization.** The product is AI Policy Watch; repo name and GitHub org are open.

6. **Domain.** aipolicywatch.org is the first candidate, pending availability check.

7. **Success metrics to instrument in V1** versus later.

8. **Keyword filter edges.** The conservative list in Appendix A may need adjustment once the first sync runs and produces a concrete set of inclusions and exclusions to review.

9. **Bill status granularity.** Whether V1 surfaces sub-states within "In Progress" (passed one chamber, in conference, etc.) or treats all in-progress bills uniformly.

10. **Cross-session bill handling.** What happens when a bill introduced in one Congress doesn't pass and is reintroduced in the next. Should they be linked in the dataset?

---

## Appendix A — Initial Scope Keyword List

Conservative keyword set for the secondary filter. Bills or documents matching the CRS "Artificial Intelligence" subject tag are automatically in scope. Bills or documents without that tag are included only if the title or abstract contains one of the following.

**Included (triggers inclusion):**
- artificial intelligence
- AI (as a standalone acronym, with basic disambiguation)
- generative AI
- machine learning
- algorithmic accountability
- algorithmic decision-making
- algorithmic disclosure
- automated decision-making
- automated decision systems
- facial recognition
- deepfake
- synthetic media
- large language model

**Deliberately excluded (does NOT trigger inclusion, to keep scope conservative):**
- "Algorithm" alone (too broad; captures non-AI algorithms)
- General "data privacy" or "Section 230" bills unless they specifically cite AI
- Autonomous vehicles (separate policy domain with different stakeholders)

This list is a living document. It is expected to be refined as the community grows and as edge cases surface. Proposals to add or remove terms are a first-class contribution category and should be made via pull request with a short rationale.

---

## Appendix B — Data Schema Sketch

Each entry in the dataset is a JSON record with a common base and type-specific fields.

**Common fields**
- `id` — unique identifier (example: `bill-119-hr5388`)
- `type` — one of `bill`, `rfi`, `hearing`
- `title` — string
- `status` — type-specific enum
- `last_updated` — ISO date
- `source_url` — authoritative source link
- `added_at` — ISO date of first appearance on AI Policy Watch
- `scope_reason` — one of `crs_tag`, `keyword_match`, `manual_include` (for auditability)

**Bill-specific**
- `bill_number`, `chamber`, `congress`, `sponsor`, `introduced_date`, `last_action_date`, `last_action_text`, `committee`, `cosponsors_count`

**RFI-specific**
- `agency`, `docket_id`, `open_date`, `close_date`, `comment_submission_url`

**Hearing-specific**
- `committee`, `chamber`, `date_time`, `location`, `witnesses` (optional array), `cspan_url` (optional)

---

*End of Product Brief v0.1. Intended as a living document. Amendments welcome via pull request once the repository is created.*
