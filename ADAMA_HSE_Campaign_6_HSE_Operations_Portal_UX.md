# ADAMA HSE — Campaign 6: HSE Operations Portal UX

**Repository:** `gibsondevhouse/oluso`  
**Repository baseline inspected:** `main` at `6dff4dd51ae63798b435ccfbf07e03eb3e6d7a9c`  
**Baseline date:** 2026-07-20  
**Campaign status:** Proposed governing campaign  
**Campaign objective:** Transform the existing application shell, landing experience, navigation, search, and record surfaces into a calm, task-driven HSE operations portal without weakening the typed domain, IndexedDB, revision, migration, or local-first architecture.  
**Primary users:** HSE professional and HSE manager working on separate corporate laptops  
**Target runtime:** SvelteKit/Svelte 5 SPA/PWA with versioned IndexedDB and offline operation after first load

---

# 1. Authority, Naming, and Campaign Position

## 1.1 Authority order

This campaign follows the repository authority order recorded in `docs/README.md`:

1. Accepted ADRs in `docs/adr/`.
2. The governing project brief, domain model, scope boundaries, and build plan.
3. Current data, workflow, page, component, and test specifications.
4. Historical campaign artifacts.
5. Existing implementation behavior.

If this campaign conflicts with an accepted ADR or governing domain invariant, the ADR or invariant wins until an explicit governance change is approved.

## 1.2 Campaign 6 is not Build Plan Phase 6

“Campaign 6” is the product-experience campaign name used in the operational-portal roadmap. It does not renumber or replace `docs/07-build-plan.md`, where “Phase 6” means the assurance and corrective-action loop.

The two plans intersect but remain distinct:

```text
Campaign 6 — HSE Operations Portal UX
→ interaction model, navigation, findability, context, presentation, accessibility

Build Plan Phase 6 — Assurance and corrective-action loop
→ domain workflow for findings, incidents, actions, verification, and reassessment
```

Campaign 6 may expose already-valid assurance records through portal surfaces. It must not claim the assurance domain is complete before its build-plan exit criteria are met.

## 1.3 Repository campaign conventions retained

Existing campaign artifacts establish the following conventions, which this document retains:

- Campaign files are Markdown artifacts at repository root with `ADAMA_HSE_..._Campaign.md` naming.
- The opening metadata identifies the repository, objective, status or baseline, and next controlled outcome.
- Governing decisions and non-negotiable constraints appear before implementation detail.
- Work is divided into ordered Parts, Stages, or campaign sequence items.
- Each implementation increment defines objective, affected files, UI/UX behavior, data requirements, error states, tests, acceptance criteria, out-of-scope items, and a recommended commit.
- Completion is determined by explicit exit criteria and verification, not by the existence of pages.
- Architecture boundaries prohibit safety-critical workflows from falling back to generic campaign records or legacy persistence.

This campaign uses numbered **Stages** for user-visible capability tracks and campaign-specific **Delivery Phases 6A–6F** for execution order.

---

# 2. Executive Decision

ADAMA HSE must expose the user’s work before it exposes the underlying data model.

The application already has much of the required technical foundation:

- A SvelteKit/Svelte 5 application shell.
- A calm green visual token set.
- Typed foundation, enterprise, operations, and chemical paths.
- IndexedDB repositories, immutable revisions, and local identities.
- An early Home experience in `DashboardPage.svelte`.
- Workspace scope and pinned scopes.
- Recent-record navigation.
- Global search across typed and legacy records.
- A command palette for navigation and recent records.
- Foundation, Function, Product, and Chemical Use workspaces.
- Record relationship, traceability, history, empty, error, archive, and restore surfaces.

The remaining problem is cohesion. Users still encounter a mixture of dashboard counts, entity-oriented navigation, broad register routes, long tab sets, legacy campaign surfaces, and incomplete activity/context behavior.

The campaign therefore makes the following decision:

> Preserve the relational and safety-critical architecture, but reorganize the presentation around the questions, responsibilities, and next actions of an HSE professional or manager.

The target is an **HSE Operations Portal**: a welcoming Home, a small stable navigation model, one search experience, connected workspaces, progressive disclosure, visible traceability, and actionable attention queues.

---

# 3. Campaign Outcomes

## 3.1 Primary outcomes

By campaign completion, a user must be able to:

1. Open ADAMA HSE and understand what needs attention without interpreting the database schema.
2. Resume recent or incomplete work in one deliberate action.
3. Select a Site, Location, or Function context and keep that context while navigating.
4. Search canonical records, workspaces, and available actions from one predictable entry point.
5. Open a connected workspace for a Location, Process, Product, Chemical Use, SEG, Scenario, Finding/Incident, or Action without repeatedly returning to list pages.
6. See essential status, gaps, relationships, evidence, review state, and next actions before advanced detail.
7. Inspect related records in a context panel without losing the current page.
8. Understand recent changes through an attributable activity feed derived from governed revision/event sources.
9. Use the full portal with a keyboard, screen reader, zoom, narrower laptop window, or reduced-motion setting.
10. Continue normal work offline after first load and clearly distinguish local write health from network state.

## 3.2 Experience statement

The opening experience should answer:

```text
Where am I working?
What needs my attention?
What was I doing?
What can I start now?
What changed?
```

It should not require the user to answer:

```text
Which table contains this?
Which register owns the relationship?
Which route family was this under?
Which ID links these records?
```

## 3.3 Success measures

The campaign must establish a representative Tifton/Ocilla dataset and record these measures:

- At least 90% of moderated participants can identify the three highest-priority Home items without assistance.
- At least 90% can resume a named in-progress record within 60 seconds.
- At least 90% can find a named Product, Process, Location, or SEG within 60 seconds.
- At least 85% can move from a record to one related record and return without losing context.
- No participant mistakes a local save indicator for cloud synchronization.
- No participant interprets a decorative count or chart as a professional, legal, or compliance conclusion.
- Keyboard-only completion is demonstrated for Home, navigation, search, command palette, one workspace, and one context-panel flow.
- Automated accessibility checks report no critical or serious violations on the agreed critical route set.
- Performance targets in Section 26 are met against the versioned reference fixture.

These measures are campaign acceptance evidence, not demographic judgments. Testing should include the HSE manager, the HSE professional, and at least one low-frequency user unfamiliar with the data model.

---

# 4. User Jobs and Design Priorities

## 4.1 HSE manager

Primary jobs:

- See what requires approval, follow-up, or escalation.
- Understand plant status without opening multiple registers.
- Review changed records and supporting context.
- Find an SDS, Product, Location, Process, SEG, action, or incident quickly.
- Verify who owns overdue work and what blocks closure.
- Return comments or decisions without changing unrelated data.

Design priority: a calm summary-first experience with obvious source links, plain-language labels, large reliable targets, and no requirement to learn entity acronyms before acting.

## 4.2 HSE professional

Primary jobs:

- Resume baseline and exposure work.
- Capture or update connected operational context.
- Resolve gaps and prepare records for review.
- Move quickly among Site, Location, Function, Process, Task, Product, Use, SEG, Scenario, controls, and evidence.
- Understand what changed and preserve traceability.

Design priority: fast keyboard-supported navigation and connected workspaces without hiding domain rigor.

## 4.3 Low-frequency reviewer

Primary jobs:

- Open a direct link or review item.
- Understand the record, source, status, owner, and requested decision.
- Avoid accidentally editing or archiving records.
- Return to Home or the review queue confidently.

Design priority: recognizable page structure, safe read-first defaults, explicit action language, and recoverable navigation.

---

# 5. Inspected Baseline and Disposition

The following snapshot is based on `main` at the inspected baseline commit. “Retain” does not mean the capability already satisfies this campaign’s exit criteria.

| Capability | Representative repository paths | Baseline | Campaign disposition |
| --- | --- | --- | --- |
| Landing route | `src/lib/pages/DashboardPage.svelte`, `src/routes/dashboard/+page.svelte`, `src/lib/navigation/route-registry.ts` | Already labels itself Home and shows scope-based totals/current context; canonical route and several concepts remain dashboard-oriented | Refactor into the task-driven Home contract; preserve useful scope queries |
| Application shell | `src/components/layout/AppShell.svelte`, `src/components/layout/SidePanel/` | Persistent shell, command button, scope bar, save state, collapse shortcuts | Retain and extend global status, focus, panel, and responsive behavior |
| Navigation | `src/lib/navigation/sidebar.config.ts`, `src/lib/navigation/route-registry.ts` | Partially reorganized but still exposes many entity/register destinations | Replace configuration with stable intent/workflow groups and a Future Modules boundary |
| Scope | `src/lib/workspace/scope.ts`, `src/lib/components/workspace/ScopeBar.svelte`, `PinnedScopes.svelte` | Organization/Country/Site/Location/Function context stored as UI preference | Retain; improve labeling, validation, and cross-route continuity |
| Recent records | `src/lib/workspace/recent-records.ts`, `RecentRecords.svelte` | Local navigation history stored as a non-blocking preference | Retain as a convenience; never treat as governed audit history |
| Global search | `src/lib/search/global-search.ts`, `src/lib/pages/GlobalSearchPage.svelte` | Searches typed enterprise records and generic registers; canonical coverage is incomplete | Rebuild as one repository-backed search contract with source-aware results |
| Command palette | `src/lib/components/navigation/CommandPalette.svelte` | Navigates sidebar destinations and recent records | Extend to navigation, record search, contextual actions, and create intents |
| Foundation workspaces | `src/lib/components/workspace/FoundationRecordWorkspace.svelte`, `RecordWorkspace.svelte` | Rich tabs, completeness, relationships, revisions, recent records | Retain and simplify through progressive disclosure |
| Other workspaces | `FunctionWorkspacePage.svelte`, `ProductWorkspacePage.svelte`, `ChemicalUseWorkspacePage.svelte` | Connected context exists for selected high-value records | Converge on one workspace contract without flattening domain-specific needs |
| Generic record detail | `src/lib/components/register/RecordDetailLayout.svelte`, `src/lib/components/register/` | Traceability, relationships, activity-like summaries, metadata | Retain for low-risk records; replace generic presentation for governed high-value objects |
| Revision history | `src/lib/data/database/`, `RevisionTimeline.svelte` | Immutable typed record revisions exist for migrated domains | Use as a source for activity projections; do not invent missing historical events |
| Visual system | `src/app.css`, shared UI components | Calm ADAMA-green token base, modest radii, clear surfaces | Formalize tokens, density, imagery rules, and visual QA |
| Tests | `src/**/*.test.ts`, `src/components/**/*.test.ts` | Unit/component/contract tests and `npm run verify`; e2e/a11y gates incomplete | Extend with portal integration, e2e, accessibility, performance, and visual checks |

## 5.1 Known baseline cautions

- The governing backlog still reports incomplete industrial-hygiene, exchange, baseline, and assurance capabilities. Home must not imply those workflows are complete.
- `global-search.ts` still reads generic/legacy register data for some domains. Search results must visibly distinguish current typed records from legacy or Future Module records where both remain reachable.
- `scope.ts` and `recent-records.ts` use `localStorage` for non-authoritative UI preferences. That does not authorize business-record persistence in `localStorage`.
- `RecordDetailLayout.svelte` currently uses “Sync / exchange” language in a state label. Campaign 6 must replace ambiguous sync language with accurate local/exchange wording.
- Existing record tabs can expose nine or ten categories at once. A tab set is not automatically progressive disclosure.
- Existing “Activity” summaries may be derived from created/updated metadata rather than a complete event history. The global feed must label its source and limitations.

---

# 6. Scope

## 6.1 In scope

- Canonical Home route and landing experience.
- Intent-based navigation and information architecture.
- Global search across canonical typed repositories and deliberately retained low-risk registers.
- Workspace contract for high-value records.
- Progressive disclosure and summary-first presentation.
- Object-experience redesign for priority records without changing their professional meaning.
- Enhanced command palette.
- Global and contextual activity projections.
- Read-first context panels and return-to-context behavior.
- Visual identity system grounded in approved ADAMA brand assets and existing tokens.
- Accessible, keyboard-operable, laptop-first interaction.
- Offline and local-write-health behavior.
- Route aliases and bookmark-safe migration.
- Portal view/query services, tests, documentation, and rollout evidence.

## 6.2 Priority record families

Campaign 6 applies the workspace/object standard first to:

1. Location/Site.
2. Operational Function.
3. Process and Task.
4. Chemical Product, SDS revision, Site Inventory, and Chemical Use.
5. SEG and Exposure Scenario when their typed domain contracts are available.
6. Finding/Incident and Corrective Action when their typed workflow contracts are available.

The campaign must not convert incomplete generic safety-critical records into a polished appearance that suggests domain readiness.

## 6.3 Retain as registers

Registers remain appropriate for:

- Searchable canonical indexes.
- Bulk review and filtering.
- Low-risk controlled lookup/reference data.
- Archived-record access.
- Migration review where the record cannot yet be represented by the target domain.

The campaign removes register-first navigation as the default mental model; it does not remove useful table views.

---

# 7. Dependencies and Entry Gates

## 7.1 Governing dependencies

Before implementation begins:

- Confirm the authority order in `docs/README.md` remains current.
- Resolve any conflict between this campaign and accepted ADRs.
- Update `docs/02-information-architecture.md`, `docs/03-sidebar-navigation.md`, `docs/06-design-principles.md`, `docs/09-routing.md`, and `docs/10-ui-architecture.md` as part of Delivery Phase 6A.
- Preserve the build-plan phases and their domain exit gates.
- Record the exact baseline commit used for implementation.

## 7.2 Technical dependencies

- SvelteKit/Svelte 5 shell and static/PWA routing.
- Browser database lifecycle and repository contracts.
- Typed services for records shown as current/production-ready.
- Stable detail routes for results, recent records, activity items, and context panels.
- Immutable `RecordRevision` coverage for activity claims.
- Dataset, installation, and local-user identity for attribution.
- Error translation for database unavailable, failed write, stale revision, missing dependency, and archived dependency states.

## 7.3 Stage-specific gates

| Stage | Entry gate |
| --- | --- |
| Home | Existing portal queries must not bypass application/repository boundaries; counts require a documented rule and source route |
| Navigation | Target IA and migration aliases approved; deferred routes classified |
| Search | Searchable types, title fields, status fields, and stable result routes defined |
| Workspaces | Record identity, lifecycle, relationship, and revision contracts available for each pilot type |
| Progressive disclosure | Essential versus advanced fields defined with HSE subject-matter review |
| Object redesign | Typed workflow available or the surface is explicitly labeled legacy/migration-only |
| Command palette | Navigation/search/create intent registry available and actions have safe route/service ownership |
| Activity feed | Events can be traced to governed revisions/import/review sources; no fabricated history |
| Context panels | Stable record route, read model, focus/URL behavior, and dirty-state policy approved |
| Visual identity | Approved brand guidance and rights-cleared assets available, or photography remains optional |

## 7.4 Exit dependency on later campaigns

Campaign 6 provides presentation infrastructure for Campaigns 7–10. It does not mark later domain campaigns complete. Empty, partial, or unavailable portal sections must say what is missing and link to an honest next step.

---

# 8. Target Information Architecture

## 8.1 Navigation model

The primary navigation should use plain-language workflow groups:

```text
Home

Operations
  Today / Work Queue
  Baseline
  Actions
  Inspections & Observations
  Incidents

The Plant
  Locations
  Functions, Processes & Tasks
  Equipment
  People
  Chemicals & SDS

Exposure
  SEGs & Memberships
  Exposure Scenarios
  Assessments
  Monitoring & Sampling
  Determinations
  Controls & Reassessment

Knowledge
  Evidence & Documents
  Review Packets

Review & Exchange
  Review Queue
  Import / Export Packages
  Conflicts
  History

Reports

Administration
  Profile & Installation
  Storage, Backups & Diagnostics

Future Modules
```

Only destinations supported by current typed or explicitly approved workflows receive normal primary-navigation treatment. Unfinished destinations may be omitted, disabled with a plain explanation, or placed under Future Modules; they must not masquerade as complete.

## 8.2 Route contract

Recommended canonical route changes:

| Current or target route | Campaign disposition |
| --- | --- |
| `/` | Redirect to `/home` |
| `/dashboard` | Preserve as a migration alias that redirects to `/home` |
| `/home` | Canonical portal landing route |
| `/search` | Canonical full search route |
| Existing stable detail routes | Preserve until an explicit migration map is implemented and tested |
| Future workspace routes | Use stable record identity; do not encode transient form state in URLs |
| Context panel selection | Use documented query/history state only as a secondary view; the full record retains a stable detail route |

Route migration must preserve browser back/forward behavior, direct links, installed-PWA navigation, and legacy bookmarks.

## 8.3 Label rules

- Use verbs for actions: Review, Resume, Start, Add, Verify, Resolve, Export.
- Use user-recognizable nouns for destinations: Home, Locations, Chemicals, Actions, Incidents.
- Expand acronyms on first prominent use: “Similar Exposure Groups (SEGs).”
- Do not expose internal IDs unless needed for traceability.
- Do not use “sync” for local persistence or manual exchange.
- Do not use “safe,” “compliant,” “approved,” or “complete” unless a governed rule supports the term.

---

# 9. Cross-Cutting UX Standards

## 9.1 Calm, readable, and task-driven

- One dominant action per section.
- Meaningful whitespace and clear section hierarchy.
- Minimum 16px default body text and no critical text below 14px without an accessibility exception.
- Primary controls use plain text labels; icons supplement rather than replace meaning.
- Dense tables remain available, but the first view explains the work before showing the table.
- Decorative charts and counts are prohibited.

## 9.2 Progressive disclosure

- The first viewport shows identity, scope, status, owner, urgent gaps, and the next action.
- Advanced metadata, full revision history, and infrequent administration controls may be behind explicit sections.
- Safety-critical warnings, failed writes, stale revisions, missing dependencies, conflicts, and overdue work are never hidden by default.
- Collapsed sections expose a meaningful summary and issue count.
- Deep links restore the relevant section when practical.

## 9.3 Accessibility

- Target WCAG 2.2 AA for campaign-owned surfaces.
- Complete keyboard operation with visible focus.
- Semantic landmarks, headings, lists, tables, dialogs, and disclosure controls.
- Status never communicated by color alone.
- At 200% zoom, critical actions and content remain available without two-dimensional page scrolling except legitimate data tables.
- Touch/click targets are at least 44 by 44 CSS pixels for primary and frequently used controls where layout permits; compact table controls require an accessible equivalent.
- Modal and panel focus is trapped only where the interaction is truly modal; focus returns to the invoking control.
- `prefers-reduced-motion` disables nonessential transitions.
- Print views do not depend on background colors or interactive disclosure state.

## 9.4 Local-first trust

- Show local write status, database failure, migration state, backup status, and conflict state accurately.
- Treat offline network state as informational when local work remains healthy.
- Never show a cloud icon or “synced” label for a successful IndexedDB write.
- A failed or blocked write remains visible until resolved or explicitly acknowledged.
- Home and workspaces must render useful cached/local data without a network after first load.

## 9.5 Error and empty states

Every campaign surface defines:

```text
Initializing
Loading
Empty
No matches
Partial/incomplete
Dirty
Saving
Saved locally
Validation failed
Save failed
Database unavailable
Stale revision
Missing dependency
Archived dependency
Not found
Offline-ready
Legacy/migration-only
```

An error message states what happened, what was preserved, and the next safe action. Empty states use a specific action only when the user has authority and the domain dependency exists.

---

# 10. Data and Architecture Implications

## 10.1 Governing rule

Portal presentation does not become a second source of truth.

```text
Canonical typed records and revisions
    ↓
Typed repositories/application services
    ↓
Portal query/read models
    ↓
Home, search, workspaces, activity, context panels
```

UI components must not issue raw IndexedDB transactions, independently create record revisions, or duplicate safety-critical status fields.

## 10.2 Portal read models

Create bounded read/query services for derived portal needs. Suggested paths:

```text
src/lib/application/portal/
├── home-query-service.ts
├── attention-query-service.ts
├── responsibility-query-service.ts
├── activity-query-service.ts
└── portal-query.types.ts

src/lib/components/home/
src/lib/components/activity/
src/lib/components/context-panel/
```

Names may change to match the final module inventory, but the boundary must remain explicit.

Derived models may include:

- `HomeAttentionItem`.
- `ContinueWorkItem`.
- `PlantStatusItem`.
- `ResponsibilitySummary`.
- `SearchResult`.
- `ActivityItem`.
- `ContextPanelRecord`.

Each derived item identifies its source record type, source ID, source revision or timestamp where available, route, scope, and derivation rule.

## 10.3 Activity data

The global activity feed should be projected from governed sources such as:

- Immutable `RecordRevision` rows.
- Review decisions and durable notes.
- Import/exchange run history when implemented.
- Corrective-action status changes and verification events when typed.
- Migration/data-quality resolutions where attributable.

Recent navigation history is not audit activity. Created/updated timestamps may support a limited summary but must not be presented as a complete historical event stream.

If a domain lacks revision/event coverage, show “Detailed activity unavailable for this legacy record” rather than reconstructing fictional events.

## 10.4 Personalization and UI preferences

Current scope, pinned scopes, recent records, navigation collapse state, dismissed noncritical tips, and preferred density may remain local UI preferences. They must:

- Never be the only copy of a business record or review decision.
- Fail without blocking record work.
- Be versioned and safely resettable.
- Avoid clinical, sensitive, or unnecessary personal data.

## 10.5 No implicit schema expansion

Campaign 6 does not add generic business fields merely to populate a card. If Home needs an owner, due date, review state, or priority that the domain does not define, the stage must either:

1. Use a governed existing field.
2. Record a typed domain dependency for the appropriate later campaign.
3. Omit or label the capability unavailable.

It must not infer compliance, exposure determination, approval, or safety state from incomplete data.

## 10.6 Architecture boundaries

Typed portal modules must not import or call:

```text
Tauri commands
Rust persistence
raw localStorage business-record operations
generic campaign mutation APIs for safety-critical entities
unvalidated exchange-package contents
```

Legacy read access may remain only behind an explicit migration/compatibility adapter and must be visible in result labeling.

---

# 11. Stage 1 — Home Experience

## Objective

Replace the dashboard-first entry with a welcoming, scope-aware Home that prioritizes current work, attention, and understandable plant status.

## Problem

The existing `DashboardPage.svelte` already provides scope totals and current context, but it still emphasizes entity counts and does not yet deliver the full “what needs my attention today?” experience.

## Primary repository paths

```text
src/lib/pages/DashboardPage.svelte
src/routes/dashboard/+page.svelte
src/lib/navigation/route-registry.ts
src/lib/pages/RouteOutlet.svelte
src/lib/components/navigation/RecentRecords.svelte
src/lib/components/navigation/PinnedScopes.svelte
src/lib/components/workspace/ScopeBar.svelte
src/lib/application/portal/**
src/lib/components/home/**
```

## Required experience

Home should contain, in this order unless user testing demonstrates a better sequence:

1. Welcome and active Site/Location context.
2. Continue Working.
3. Needs Attention.
4. Today at the Plant.
5. Quick Actions.
6. Recent Activity.
7. My Responsibilities.
8. Narrow storage/backup/conflict status when action is required.

Home must remain useful when a section has no data. It should not render a wall of empty cards.

## Delivery phases

### Phase 1A — Contract

- Define every Home section’s source records, sort order, limits, empty state, and source route.
- Define priority without inventing a legal or professional conclusion.
- Define the first-use experience for an empty database.

### Phase 1B — Route cutover

- Create canonical `/home`.
- Redirect `/` and `/dashboard` to `/home` without losing query state that remains valid.
- Rename components and test descriptions where practical while preserving migration history.

### Phase 1C — Implement and verify

- Build the Home query service and presentation components.
- Reuse current scope, recent-record, and typed repository infrastructure.
- Add loading, error, partial-data, and offline-ready behavior.

## Data requirements

- Home items are derived and link to source records.
- A count is shown only when the included population and rule are documented.
- “Continue Working” may use recent records plus typed draft/incomplete work; it must distinguish navigation recency from domain workflow state.
- “Today at the Plant” uses plain-language status rows, not charts.

## Tests

- Root and legacy route redirects.
- First-use and no-scope states.
- Scoped/unscoped derivation.
- Priority ordering and source links.
- Partial repository failure without false success.
- Offline reload.
- Keyboard order and accessible names.
- Manager usability scenario.

## Stage acceptance criteria

- `/home` is canonical and `/dashboard` is a tested alias.
- The first viewport answers scope, attention, and resume-work questions.
- Every attention item links to a source or remediation route.
- No deferred module contributes readiness or attention counts.
- No decorative chart or unexplained total appears.
- Home does not claim a workflow is complete when its typed rule is unavailable.
- `npm run verify` passes with the new tests.

## Out of scope

- Executive analytics.
- Cross-site trend reporting.
- Automated prioritization using machine learning.
- New assurance or IH domain entities.

## Recommended commit

```text
feat(portal): replace dashboard entry with task-driven Home
```

---

# 12. Stage 2 — Navigation and Information Architecture

## Objective

Replace entity/register-first navigation with a small, stable, plain-language workflow model.

## Primary repository paths

```text
src/lib/navigation/sidebar.config.ts
src/lib/navigation/sidebar.types.ts
src/lib/navigation/route-registry.ts
src/components/layout/SidePanel/**
src/components/layout/AppShell.svelte
docs/02-information-architecture.md
docs/03-sidebar-navigation.md
docs/09-routing.md
```

## Required changes

- Implement the navigation model in Section 8.
- Promote Home, current work, plant context, exposure work, review, and reports.
- Place deferred/legacy modules behind a collapsed Future Modules boundary.
- Remove individual create/edit/detail/history routes from primary navigation.
- Show counts only for actionable work such as overdue items, unresolved conflicts, or reviews.
- Preserve direct routes and migration aliases even when a destination leaves the sidebar.
- Persist collapse state as a noncritical local preference.

## Accessibility and interaction

- Fully keyboard-operable expand/collapse and nested navigation.
- Active destination and current section conveyed semantically and visually.
- Collapsed icons have tooltips and accessible names.
- Narrow windows use an accessible drawer or collapsed rail without trapping focus.
- Global navigation remains stable between records.

## Tests

- Configuration-to-render mapping.
- Active-state matching for list, detail, edit, and alias routes.
- Future Modules separation.
- Keyboard and focus behavior.
- PWA deep links and browser back/forward.
- No inaccessible or orphaned current route.

## Stage acceptance criteria

- A low-frequency user can predict where Home, a Location, a Chemical/SDS, an assessment, an action, a review, and settings live.
- Safety-critical current workflows are not hidden under Future Modules.
- Deferred routes do not appear production-ready.
- No primary section is named for an implementation detail or storage collection.
- All prior valid bookmarks either resolve or reach an explicit migration explanation.

## Out of scope

- Deleting legacy routes or records before migration gates pass.
- Reactivating deferred modules.

## Recommended commit

```text
refactor(navigation): organize the portal around user intent
```

---

# 13. Stage 3 — Global Search

## Objective

Provide one offline-capable search experience for canonical records, workspaces, and deliberately retained legacy/reference records.

## Primary repository paths

```text
src/lib/search/global-search.ts
src/lib/search/global-search.test.ts
src/lib/pages/GlobalSearchPage.svelte
src/lib/pages/GlobalSearchPage.test.ts
src/lib/navigation/route-registry.ts
src/lib/data/repositories/**
```

## Required changes

- Replace ad hoc source gathering with a typed search-provider registry.
- Cover all current canonical types with stable detail routes.
- Label type, Site/scope, status, lifecycle, matched field, and legacy/current source.
- Support filters for record type, Site/scope, active/archived, and current/legacy where relevant.
- Rank exact name/business-ID matches before partial text matches.
- Keep full result navigation available without the command palette.
- Provide recent queries only as an optional local preference; never persist sensitive search text by default.

## Interaction

- `/` may focus/open search when focus is not in an editable field and browser behavior is preserved.
- Arrow keys move through results; Enter opens; Escape clears or closes according to context.
- Results explain no matches and offer safe filter reset.
- Search never mutates records.

## Data and performance

- Search runs through typed read/query boundaries.
- Indexes or cached projections may be used, but stale state must be invalidated after governed mutations.
- A missing index must degrade to a correct search, not an empty false result.
- Performance target: results update within 150 ms at the 95th percentile after debounce on the versioned reference fixture, excluding initial database open.

## Tests

- Exact, partial, case, whitespace, business-ID, relationship text, archived, and filter cases.
- Stable result routes.
- Typed/legacy source labels.
- Index invalidation after create/update/archive/restore.
- Empty and repository-failure states.
- Keyboard and screen-reader behavior.
- Reference-fixture performance.

## Stage acceptance criteria

- A user can find every priority record family from one route.
- Search does not omit current typed records because a legacy adapter is unavailable.
- No result implies typed validity for an unresolved legacy record.
- Every result has a usable label and stable destination.

## Recommended commit

```text
feat(search): unify offline search across portal workspaces
```

---

# 14. Stage 4 — Connected Workspaces

## Objective

Make high-value records feel like connected work contexts rather than isolated database rows.

## Primary repository paths

```text
src/lib/components/workspace/**
src/lib/components/register/**
src/lib/pages/FoundationCrudPage.svelte
src/lib/pages/FunctionWorkspacePage.svelte
src/lib/pages/chemical/ProductWorkspacePage.svelte
src/lib/pages/chemical/ChemicalUseWorkspacePage.svelte
src/lib/pages/ExposureScenariosPage.svelte
```

## Workspace contract

Every governed workspace provides, as applicable:

1. Plain-language identity and record type.
2. Context path and current scope.
3. Lifecycle, review, data-quality, local/exchange, and revision state.
4. One primary next action.
5. Overview.
6. Relationships and missing-context indicators.
7. Evidence and notes.
8. Open actions/review items.
9. Attributable history.
10. Safe archive/restore and full edit access.

Domain-specific workspaces may add necessary sections; the shared contract must not flatten safety-critical distinctions.

## Delivery phases

### Phase 4A — Shared contract

- Consolidate `WorkspaceHeader`, tabs/disclosures, status summaries, relationships, revisions, and actions.
- Define read-model interfaces and error handling.

### Phase 4B — Pilot workspaces

- Location/Site.
- Process/Task.
- Product/Chemical Use.

### Phase 4C — Extend when typed gates pass

- SEG/Scenario.
- Finding/Incident/Corrective Action.

## Tests

- Direct-load, refresh, back/forward, archive/restore, missing dependency, and history states.
- Cross-link integrity.
- Scope continuity.
- Typed service boundary enforcement.
- Print and narrower-laptop layout.

## Stage acceptance criteria

- The pilot record families share a recognizable structure.
- Users can traverse at least three linked records and return without rebuilding context.
- Missing relationships are visible without creating fake placeholders.
- High-value typed records do not fall back to `Record<string, unknown>` mutation paths.
- A workspace remains usable when supplementary related-data queries fail.

## Recommended commit

```text
feat(workspace): standardize connected record workspaces
```

---

# 15. Stage 5 — Progressive Disclosure

## Objective

Reduce cognitive load while keeping urgent, safety-critical, and traceability information immediately visible.

## Required changes

- Classify workspace content as Essential, Working Detail, Evidence/Relationships, or History/Administration.
- Limit the default primary navigation within a workspace to the most frequent sections; place additional sections under an accessible “More” or disclosure structure.
- Add summary rows to collapsed sections: status, count, gap, and last update.
- Preserve section identity in the URL or history state where safe and useful.
- Keep validation summaries and the first invalid field visible during edit flows.
- Allow users to expand advanced sections without losing unsaved work.

## Safety rules

Never hide by default:

- Failed local writes.
- Stale revisions or import conflicts.
- Archived/missing dependencies.
- Critical or overdue actions.
- Operating condition on an exposure scenario.
- The exact limit/version/basis used for a comparison.
- Professional determination attribution.
- Required evidence or data gaps blocking review/closure.

## Tests

- Default visibility and collapsed summaries.
- Deep-link section restoration.
- Keyboard activation and `aria-expanded`.
- No loss of dirty form state.
- Screen-reader heading order.
- SME review of essential versus advanced classification.

## Stage acceptance criteria

- A user can identify record identity, status, context, gaps, and next action without opening advanced sections.
- No workspace presents ten undifferentiated tabs as its default navigation.
- Collapsing a section never hides the existence of blocking work.
- The classification is documented per priority record family.

## Recommended commit

```text
refactor(ui): apply progressive disclosure to workspaces
```

---

# 16. Stage 6 — Object Experience Redesign

## Objective

Replace CRUD-first presentation for priority objects with overview, status, relationships, timeline, actions, documents/evidence, history, and properties appropriate to the object’s user job.

## Required object questions

| Object | First question the surface answers |
| --- | --- |
| Location/Site | What work happens here, and what needs attention here? |
| Function | Where is this capability performed and who owns it? |
| Process/Task | How is this work performed, with what materials, people, hazards, and controls? |
| Chemical Product/Use | Where and how is this Product used, with which SDS and exposure context? |
| SEG | Who belongs to this group, for which effective period and work context? |
| Exposure Scenario | Who may be exposed, to what, where, during which work and condition, with what controls and evidence? |
| Finding/Incident | What happened or was observed, what is linked, and what remains unresolved? |
| Corrective Action | Who owns it, when is it due, what blocks it, and how will completion be verified and closed? |

## Rules

- Generic registers remain entry indexes, not the only object experience.
- Properties are grouped and secondary to operational meaning.
- Edit actions use typed services and domain validation.
- Archive/restore remains explicit and impact-aware.
- Legacy records are visibly labeled and routed to migration resolution where required.
- Object redesign cannot silently change status semantics.

## Tests

- Object-specific source/relationship queries.
- Status and action eligibility.
- Archived and missing dependencies.
- Edit/archive/restore links.
- History and source attribution.
- No generic safety-critical mutation fallback.

## Stage acceptance criteria

- Each priority object answers its first question in the opening view.
- Tables are available but no longer the required mental assembly point.
- Status, relationships, history, and next action are consistently discoverable.
- Domain meaning remains distinct across Product, Use, SEG, Scenario, result, interpretation, determination, finding, incident, completion, verification, and closure.

## Recommended commit

```text
refactor(workspace): replace CRUD-first priority object views
```

---

# 17. Stage 7 — Command Palette

## Objective

Extend the existing command palette into a fast, safe layer for navigation, record lookup, and contextual create/start actions.

## Primary repository paths

```text
src/lib/components/navigation/CommandPalette.svelte
src/components/layout/AppShell.svelte
src/lib/navigation/sidebar.config.ts
src/lib/search/**
src/lib/workspace/recent-records.ts
```

## Command groups

```text
Navigate
Recent
Search records
Create / start
Current context
Help / shortcuts
```

## Rules

- `Ctrl+K` and `Cmd+K` open the palette; a visible button remains available.
- The palette performs no hidden mutation. Create/start commands navigate to a typed workflow or request explicit confirmation when a direct service action is later approved.
- Commands are generated from one intent registry with title, synonyms, group, eligibility, route/action, and accessible description.
- Ineligible actions are hidden or disabled with a reason; they are never offered and allowed to fail silently.
- Search results and page navigation use the same canonical labels/routes as full search.
- Focus enters the search field, arrow keys navigate, Enter selects, Escape closes, and focus returns to the invoker.

## Tests

- Shortcut collisions and editable-field behavior.
- Focus trap/return and keyboard selection.
- Command ranking, synonyms, and grouping.
- Recent and canonical search results.
- Ineligible action behavior.
- Narrow-window presentation.

## Stage acceptance criteria

- Users can navigate to any primary destination, find a priority record, and start an eligible quick action without menu hunting.
- The palette and full search never disagree on a record’s title or destination.
- No command bypasses domain validation or revision handling.

## Recommended commit

```text
feat(navigation): expand the command palette into portal intents
```

---

# 18. Stage 8 — Global Activity Feed

## Objective

Provide an attributable, scope-aware timeline of meaningful changes without creating a competing audit record.

## Primary repository paths

```text
src/lib/data/database/**
src/lib/components/workspace/RevisionTimeline.svelte
src/lib/components/register/record-traceability.ts
src/lib/application/portal/activity-query-service.ts
src/lib/components/activity/**
```

## Activity contract

Each item includes:

```text
event type
plain-language summary
record type and identity
actor
timestamp
scope/Site where resolvable
source revision/event ID
source package where applicable
stable destination
legacy/limited-history indicator where applicable
```

## Feed behavior

- Home shows a short relevant feed; `/activity` may provide the full view if approved in the route contract.
- Filters include current scope, actor, type, and time period.
- High-volume mechanical revisions may be grouped only when the underlying events remain inspectable.
- Imported events preserve original/package attribution and local apply attribution.
- Navigation recency is never mixed into governed activity.
- The feed clearly states when older legacy history is incomplete.

## Tests

- Revision-to-activity mapping.
- Actor, scope, package, and route attribution.
- Archive/restore and status-change wording.
- Same-timestamp stable ordering.
- Legacy limited-history behavior.
- Grouping without loss of source access.
- Performance and pagination/virtualization when needed.

## Stage acceptance criteria

- Every displayed event can be traced to a governed source.
- The feed does not fabricate field-level history from one `updatedAt` value.
- Users can open the changed record and relevant revision/history.
- Scope filters cannot hide a global write/storage failure that requires attention.

## Recommended commit

```text
feat(activity): project attributable revision activity
```

---

# 19. Stage 9 — Context Panels

## Objective

Allow users to inspect related records without losing the primary workspace or list context.

## Primary repository paths

```text
src/components/layout/AppShell.svelte
src/lib/components/context-panel/**
src/lib/components/register/RelationshipPanel.svelte
src/lib/components/workspace/ConnectedRecords.svelte
src/lib/navigation/route-registry.ts
```

## Version 1 scope

- Read-first inspection of identity, status, context, key relationships, gaps, and recent activity.
- “Open full workspace” action.
- Safe quick links to related records.
- Browser back closes the panel before leaving the underlying page when panel state was added to history.
- Direct link behavior is documented and tested.

## Safety constraints

- Do not place complex edit forms in Version 1 panels.
- Destructive actions remain in the full workspace with normal confirmation and impact context.
- Opening/closing a panel never discards dirty state on the underlying page.
- Missing or archived records render explicit states.
- On narrow windows, the panel becomes a full-width sheet or navigates to the full record; it never reduces content below usable width.

## Accessibility

- Use dialog semantics only when modal behavior is intended; otherwise use a labeled complementary region.
- Provide an accessible name, close control, predictable focus entry, Escape behavior, and focus return.
- Background interaction matches the selected modal/nonmodal model.

## Tests

- Open/close, nested link, browser back/forward, refresh, and direct-link behavior.
- Focus and screen-reader semantics.
- Dirty underlying form preservation.
- Missing/archived/error state.
- Narrow-window fallback.

## Stage acceptance criteria

- A user can inspect a related record and return without losing list filters, scroll, scope, or workspace section.
- Context panels do not become a second incomplete edit surface.
- Every panel provides a stable route to the full record.

## Recommended commit

```text
feat(ui): add read-first record context panels
```

---

# 20. Stage 10 — Visual Identity System

## Objective

Formalize a calm, spacious, approachable ADAMA HSE visual system that supports dense professional work without resembling a terminal or an imitation public website.

## Primary repository paths

```text
src/app.css
src/lib/components/ui/**
src/lib/components/workspace/**
src/components/layout/**
static/**
docs/06-design-principles.md
docs/component-specs/**
```

## Identity principles

- Retain and formalize the existing green, neutral, white, and restrained blue palette.
- Use typography, spacing, surface hierarchy, and photography to create calm before adding visual ornament.
- Preserve data density for professional work through optional compact tables, not universally small type.
- Use modest radii and restrained elevation.
- Reserve red, amber, and green for governed states with text/icon reinforcement.
- Use charts only when they reveal a decision-relevant pattern unavailable in a short list or table.
- Provide print styles for review and field packets.

## ADAMA relationship

- Capture the emotional qualities of the ADAMA public presence: calm, clear, human, agricultural/industrial, and confident.
- Do not copy proprietary page layouts, unapproved logos, photography, illustrations, or marketing claims.
- Use only rights-cleared and approved assets.
- If approved plant photography is unavailable, ship a polished non-photographic hero rather than a placeholder stock image.

## Token system

Document and implement semantic tokens for:

```text
color
type scale
spacing
surface and border
radius
elevation
motion
focus
state tones
data visualization where permitted
print
density
```

Component styles should consume semantic tokens rather than adding one-off color values.

## Tests and review

- Automated contrast checks.
- 200% zoom and high-contrast/forced-colors review where supported.
- Reduced-motion behavior.
- Representative visual snapshots at agreed laptop widths.
- Print preview for Home summary, one workspace, and one review packet.
- Rights/brand review for every shipped image or mark.
- Manager preference review using realistic data rather than empty mockups.

## Stage acceptance criteria

- Campaign-owned surfaces use documented semantic tokens.
- The application remains readable in comfortable and compact data-density modes if both are offered.
- Visual state meaning is consistent and never color-only.
- No unapproved brand asset ships.
- Home and workspaces feel part of one system while retaining domain-specific distinctions.

## Recommended commit

```text
feat(design): formalize the ADAMA HSE portal identity system
```

---

# 21. Campaign Delivery Phases

## Phase 6A — Contract and baseline

1. Record implementation baseline and representative fixture.
2. Approve target IA, route migration, Home derivations, workspace contract, and essential/advanced field classification.
3. Update governing docs/specs.
4. Define semantic tokens needed by all stages.
5. Add portal-specific architecture tests and performance harness.

Exit gate:

- Every stage has approved source data, route ownership, error states, and measurable acceptance criteria.
- No unresolved governance conflict is hidden in implementation.

## Phase 6B — Entry and orientation

1. Stage 1 — Home.
2. Stage 2 — Navigation and IA.
3. Route aliases and bookmarks.

Exit gate:

- Users land on Home, understand current scope/attention, and can navigate primary work without encountering deferred-module clutter.

## Phase 6C — Find and enter context

1. Stage 3 — Global Search.
2. Stage 4 — Connected Workspace shared contract and pilots.

Exit gate:

- Users can find a priority record and enter a connected workspace with stable context.

## Phase 6D — Simplify object work

1. Stage 5 — Progressive Disclosure.
2. Stage 6 — Object Experience Redesign.

Exit gate:

- Pilot objects answer their operational question before exposing advanced properties.

## Phase 6E — Accelerate and preserve context

1. Stage 7 — Command Palette.
2. Stage 8 — Global Activity Feed.
3. Stage 9 — Context Panels.

Exit gate:

- Users can move, inspect, and understand change history without menu hunting or losing their place.

## Phase 6F — Identity, hardening, and acceptance

1. Complete Stage 10 visual-system rollout.
2. Run accessibility, performance, offline, migration-alias, and end-to-end gates.
3. Conduct HSE professional and manager acceptance with realistic Tifton/Ocilla data.
4. Update status, module inventory, screenshots, and support guidance.

Exit gate:

- All campaign acceptance criteria and Definition of Done are evidenced.

---

# 22. Documentation and Repository Path Plan

## 22.1 Campaign artifact

Recommended repository destination after review:

```text
ADAMA_HSE_Campaign_6_HSE_Operations_Portal_UX.md
```

## 22.2 Governing documents to update

```text
docs/00-project-brief.md
docs/02-information-architecture.md
docs/03-sidebar-navigation.md
docs/06-design-principles.md
docs/07-build-plan.md            # cross-reference only; do not renumber phases
docs/08-scope-boundaries.md
docs/09-routing.md
docs/10-ui-architecture.md
docs/11-state-management.md
docs/12-future-roadmap.md
docs/page-specs/dashboard.md      # replace/rename through an intentional doc migration
docs/component-specs/app-shell-specs.md
docs/component-specs/record-detail-layout-specs.md
docs/test-specs/**
```

## 22.3 Primary implementation areas

```text
src/routes/**
src/components/layout/**
src/lib/navigation/**
src/lib/pages/**
src/lib/components/home/**
src/lib/components/navigation/**
src/lib/components/workspace/**
src/lib/components/context-panel/**
src/lib/components/activity/**
src/lib/components/register/**
src/lib/search/**
src/lib/workspace/**
src/lib/application/portal/**
src/lib/data/repositories/**
src/app.css
static/**
```

## 22.4 Test areas

```text
src/lib/pages/*.test.ts
src/lib/search/*.test.ts
src/lib/navigation/*.test.ts
src/lib/components/**/*.test.ts
src/components/layout/**/*.test.ts
src/lib/application/portal/*.test.ts
src/lib/data/**/*.test.ts
src/tests/**
```

Exact files allowed to change must be narrowed in each implementation prompt, following `docs/agent-specs/implementation-prompt-template.md`.

---

# 23. Risks and Mitigations

| Risk | Consequence | Mitigation / gate |
| --- | --- | --- |
| Polishing incomplete generic workflows | Users trust unsupported domain behavior | Typed-workflow entry gates; explicit legacy/migration labeling; architecture tests |
| Home becomes another dashboard wall | Cognitive overload remains | Section order, item limits, plain-language status rows, manager usability acceptance |
| Counts imply completeness/compliance | Misleading operational decisions | Versioned derivation rules and source links; prohibit unsupported conclusions |
| Navigation rename breaks bookmarks | Lost context and support burden | Alias map, redirect tests, back/forward and installed-PWA tests |
| Search mixes typed and legacy identity | Duplicate/confusing results | Canonical identity mapping, source labels, migration-resolution routes |
| Activity feed fabricates history | False audit confidence | Governed source IDs/revisions; limited-history labels; no reconstruction from timestamps alone |
| Context panels duplicate editing | Inconsistent validation and lost writes | Read-first V1; full workspace for edit/destructive actions |
| Progressive disclosure hides risk | Important state overlooked | Never-hide list in Stage 5; collapsed issue summaries; SME review |
| Photography or brand use is unapproved | Legal/brand issue | Rights/brand review; non-photographic fallback |
| Performance degrades with cross-store queries | Slow Home/search | Bounded query services, indexes/projections, versioned fixture performance gates |
| UI preference storage is confused with record storage | Architecture regression | Explicit preference boundary and tests; no business records in `localStorage` |
| Visual redesign outpaces domain campaigns | Attractive but misleading shell | Honest empty/partial states and later-campaign dependencies |
| Older/low-frequency users are under-tested | Portal remains difficult to use | Moderated task testing with the actual manager and unfamiliar reviewer |
| Scope expands into campaigns 7–10 | Campaign never exits | Out-of-scope enforcement and dependency backlog |

---

# 24. Testing Strategy

## 24.1 Unit tests

- Home attention and responsibility derivations.
- Search normalization, ranking, filtering, routing, and source labels.
- Navigation intent and route alias resolution.
- Activity projection and stable ordering.
- Progressive disclosure classification helpers.
- Context-panel history/URL state.

## 24.2 Component tests

- Home sections and empty/error/partial states.
- Sidebar and narrow navigation.
- Search and command keyboard behavior.
- Workspace headers, statuses, disclosures, relationships, history, and actions.
- Activity items and limited-history indicators.
- Context-panel focus and close behavior.
- Global local-write/diagnostic states.

## 24.3 Integration tests

- IndexedDB-backed Home and search queries.
- Mutation followed by Home/search/activity update.
- Archive/restore and stale revision behavior.
- Partial related-repository failure.
- Scoped queries across Site/Location/Function.
- Legacy/current result coexistence and migration links.
- Offline application reload.

## 24.4 End-to-end critical journeys

1. First use: create/select context and reach a valid starting workflow.
2. Morning review: open Home, identify attention, inspect source, return.
3. Resume work: continue a draft/incomplete item and save locally.
4. Find record: search a Product, inspect its Use, open related Process, return.
5. Manager review: open review item, inspect history/evidence, take an eligible action or reach the correct later-campaign boundary.
6. Failure recovery: simulate database/write failure and verify no false success.
7. Offline: reload installed/browser app and complete a read/edit flow locally.
8. Legacy link: open `/dashboard` or an old route and reach the correct destination/explanation.

## 24.5 Accessibility verification

- Automated scan on Home, search, one list, one workspace, command palette, and context panel.
- Keyboard-only execution of the critical journeys.
- Screen-reader review of landmarks, headings, statuses, disclosures, tables, dialog/panel semantics, and live regions.
- 200% zoom, narrow laptop width, reduced motion, and forced-colors review where supported.
- Print verification for designated review content.

## 24.6 Usability acceptance

Use realistic, non-sensitive Tifton/Ocilla fixtures. Do not test with lorem ipsum or empty screens only.

Capture:

- Task success/failure.
- Time on task.
- Assistance required.
- Navigation/search path.
- Misinterpretations of status or conclusions.
- Confidence rating.
- Observed accessibility or readability problem.

Material failures create tracked campaign defects and repeat testing after correction.

---

# 25. Error Handling Requirements

The portal must handle and translate, where applicable:

```text
DatabaseUnavailableError
TransactionFailedError
ValidationError
StaleRevisionError
RecordNotFoundError
RecordArchivedError
MissingRelationshipError
ArchivedRelationshipError
MigrationRequiredError
UnsupportedSchemaError
SearchIndexUnavailableError
PartialProjectionError
```

Rules:

- A Home card or supplementary relationship failure must not blank the entire application when core data remains usable.
- Partial results state which source is unavailable and avoid false zero counts.
- A failed search index falls back to a correct slower path when feasible.
- A stale revision does not overwrite current data.
- Context-panel errors preserve the underlying page.
- Failed route aliases land on an explicit resolution view, not a generic blank page.
- Errors are logged locally only according to approved diagnostics and must not leak sensitive data into URLs or console output intended for routine users.

---

# 26. Performance and Quality Targets

Measure against a versioned representative dataset and a supported corporate-laptop/browser profile documented with the result.

- Shell and cached Home structure visible within 1 second after route activation, excluding first database migration.
- Home actionable data ready within 2 seconds at the 95th percentile after database open.
- Search results update within 150 ms at the 95th percentile after debounce.
- Command palette opens and accepts input within 100 ms at the 95th percentile.
- Read-first context panel displays cached/basic content within 200 ms at the 95th percentile after selection; a loading state appears immediately when data is not ready.
- No unbounded all-record query runs on each keystroke.
- Large feeds and result sets use paging, limits, or virtualization with accessible alternatives.
- Layout shift does not move a primary action after it becomes available.

If a target cannot be met, record the measured result, fixture, root cause, user impact, and approved remediation rather than silently lowering the target.

---

# 27. Campaign Acceptance Criteria

Campaign 6 is complete when:

- `/home` is the canonical landing page and old dashboard links migrate safely.
- Home presents continue-work, attention, plant status, quick actions, recent activity, and responsibility concepts using governed sources or honest unavailable states.
- Primary navigation is organized around user intent and current workflows.
- Deferred modules are separated and do not contribute current-readiness signals.
- Global search covers priority canonical records and labels legacy/current sources accurately.
- High-value pilot records use the connected workspace contract.
- Priority workspaces use progressive disclosure without hiding blocking or safety-critical state.
- The command palette supports navigation, record search, recent records, and eligible start/create intents.
- The activity feed is traceable to revisions/events and discloses limited legacy history.
- Read-first context panels preserve underlying context and provide stable full-record routes.
- Visual tokens, typography, spacing, state language, and approved assets are documented and consistently implemented on campaign-owned surfaces.
- Local writes, offline network state, backup state, and manual exchange state are described accurately.
- Typed portal modules do not call legacy mutation paths, raw business-record `localStorage`, Tauri commands, or Rust persistence.
- Existing immutable revision, expected-revision, archive/restore, migration, and repository behavior is not regressed.
- Critical journeys pass in supported browsers and installed-PWA mode where applicable.
- Accessibility, performance, route-alias, and realistic-data usability gates pass.
- `npm run verify` passes from a clean checkout, and any campaign-required checks not yet included in that command are listed with exact successful commands/results.
- Governing documentation and module inventory reflect the final implementation honestly.

---

# 28. Out of Scope

Campaign 6 does not include:

- New generic campaign registers.
- Completion of the Operations Experience domain campaign.
- Completion of the Industrial Hygiene Experience domain campaign.
- Emergency command, dispatch, responder tracking, or public notification.
- Executive analytics or a cross-site executive reporting program.
- Automatic cloud synchronization or silent OneDrive monitoring.
- SaaS hosting, multi-tenancy, enterprise SSO, or remote user administration.
- Clinical medical information, diagnosis, test results, or medical notes.
- Automated exposure determinations, legal interpretations, or compliance certification.
- Full document-management or binary attachment platform behavior.
- Training/LMS, complex MOC/PSSR, broad environmental/waste, or permit-suite reactivation.
- Removal of Tauri/Rust or legacy readers before their separate migration/removal gates pass.
- Unapproved ADAMA branding, photography, or public-site replication.
- Phone-first field inspection redesign.
- Replacing stable domain services with UI-specific business rules.

---

# 29. Recommended Branch and Commits

Recommended integration branch:

```text
codex/campaign-6-hse-operations-portal-ux
```

Recommended commit sequence:

```text
docs: govern Campaign 6 portal UX and route migration
```

```text
feat(portal): replace dashboard entry with task-driven Home
```

```text
refactor(navigation): organize the portal around user intent
```

```text
feat(search): unify offline search across portal workspaces
```

```text
feat(workspace): standardize connected record workspaces
```

```text
refactor(ui): apply progressive disclosure to priority objects
```

```text
feat(navigation): expand command palette intents
```

```text
feat(activity): project attributable revision activity
```

```text
feat(ui): add read-first record context panels
```

```text
feat(design): formalize the ADAMA HSE portal identity
```

```text
test(portal): verify accessibility offline routes and critical journeys
```

Each commit must remain reviewable and keep `npm run verify` passing. Do not combine a domain-schema migration with broad visual changes in one commit.

---

# 30. Definition of Done

The campaign is done only when the portal proves:

```text
Task-driven entry
+ stable information architecture
+ dependable search
+ connected context
+ progressive detail
+ attributable activity
+ safe local-first behavior
+ accessible visual identity
+ tested route and data integrity
```

A visually attractive Home page is not sufficient.

A renamed dashboard is not sufficient.

A command palette that searches only navigation labels is not sufficient.

A workspace with many tabs is not sufficient.

The finished result must let the HSE manager and HSE professional open ADAMA HSE each morning, understand the current situation, resume or start the right work, inspect the supporting context, and trust that the underlying records, revisions, and professional boundaries remain intact.
