\# dashboard.md

Project: OLUSO    
Status: Draft    
Last Updated: 2026-07-06    
Owner: Product / UI Architecture    
Route: \`/dashboard\`    
Sidebar Parent: Dashboard    
Related Documents: 01-product-vision.md, 02-information-architecture.md, 03-sidebar-navigation.md, 04-domain-model.md, 05-user-workflows.md, 08-scope-boundaries.md, 09-routing.md, 10-ui-architecture.md, 11-state-management.md, ADR-0002-navigation-structure.md, ADR-0003-registers-vs-records.md, sidepanel-specs.md

\---

\#\# 1\. Purpose

This document defines the OLUSO Dashboard page specification.

The dashboard is the primary landing surface for OLUSO. It should orient the user, summarize current operational work, and provide fast entry into the core registers without becoming a cluttered command center, analytics product, compliance cockpit, AI surface, or enterprise EHS homepage.

The dashboard exists to answer:

\- What needs attention?  
\- What was recently worked on?  
\- What records are incomplete?  
\- What corrective actions are open?  
\- Is the local data layer usable?  
\- Where should the user go next?

The dashboard is a navigation and awareness surface. It is not the source of truth.

\---

\#\# 2\. Page Objective

Build a quiet, useful landing page that helps the user resume HSE work quickly.

The page must support:

\- Recent record access.  
\- Open corrective action visibility.  
\- Draft or incomplete record visibility.  
\- Priority finding visibility.  
\- Basic local data status.  
\- Clear links into the relevant registers.  
\- Empty states for first use.  
\- Error states when local data cannot be loaded.

The dashboard should make OLUSO feel complete without pretending to be more mature than it is.

\---

\#\# 3\. Route Contract

| Field | Value |  
|---|---|  
| Route | \`/dashboard\` |  
| Route Type | Landing |  
| Sidebar Item | Dashboard |  
| Requires Record ID | No |  
| Parent Layout | App Shell |  
| Source of Truth | Local persistence via derived dashboard queries |  
| Can Edit Records Directly | No |  
| Can Create Records Directly | Only through explicit create links |

The root route \`/\` may redirect to \`/dashboard\`.

\---

\#\# 4\. Page Scope

\#\#\# 4.1 In Scope

The dashboard may show:

\- Recent records.  
\- Open corrective actions.  
\- Draft or incomplete records.  
\- Priority findings.  
\- Local data status.  
\- Quick links into core registers.  
\- Basic counts derived from durable records.

\#\#\# 4.2 Out of Scope

The dashboard must not include:

\- Compliance scoring.  
\- AI-generated insights.  
\- Predictive risk ranking.  
\- Regulatory interpretation.  
\- Audit readiness scoring.  
\- Full analytics charts.  
\- Incident management dashboard.  
\- Training dashboard.  
\- Permit dashboard.  
\- Enterprise KPIs.  
\- Team/user workload views.  
\- Editable report widgets.

If a dashboard element requires a complex interpretation layer, it is not MVP dashboard material.

\---

\#\# 5\. Required Page Regions

The MVP dashboard should use the following regions:

\`\`\`text  
Dashboard  
├── Page Header  
├── Work Summary Cards  
│   ├── Open Corrective Actions  
│   ├── Draft / Incomplete Records  
│   ├── Priority Findings  
│   └── Recent Activity  
├── Recent Records  
├── Needs Attention  
├── Quick Start / Register Links  
└── Local Data Status  
\`\`\`

The layout may be adjusted by implementation, but these regions define the page responsibilities.

\---

\#\# 6\. Page Header

The page header should include:

\- Page title: \`Dashboard\`.  
\- Short page description.  
\- Optional timestamp or “last refreshed” label if useful.

Recommended copy:

\> Resume field work, review open actions, and jump back into core HSE registers.

The header should not include marketing copy or decorative slogans.

\---

\#\# 7\. Work Summary Cards

Summary cards provide lightweight derived counts.

| Card | Purpose | Target Route |  
|---|---|---|  
| Open Corrective Actions | Shows active follow-up burden | \`/actions/corrective-actions\` |  
| Draft / Incomplete Records | Shows unfinished work | Relevant register filtered to drafts/incomplete |  
| Priority Findings | Shows findings needing review | \`/field/findings\` |  
| Recent Activity | Shows latest work touched | Recent Records section |

\#\#\# Rules

\- Counts must be derived from durable local records.  
\- Cards must link to registers or filtered register views when available.  
\- Cards must not create their own source of truth.  
\- Cards must not imply compliance conclusions.  
\- Cards must handle zero-count states cleanly.

\---

\#\# 8\. Recent Records

Recent Records shows records the user recently created, viewed, or updated.

\#\#\# Recommended Fields

\- Record title/name.  
\- Record type.  
\- Status.  
\- Last updated timestamp.  
\- Parent domain.  
\- Link to detail page.

\#\#\# Record Types

Recent Records may include:

\- Locations.  
\- Processes.  
\- Chemicals.  
\- Hazards.  
\- SEGs.  
\- Findings.  
\- Corrective Actions.

\#\#\# Rules

\- Recent Records must link to durable record detail routes.  
\- Missing or deleted records must be omitted or shown with a safe unavailable state.  
\- Archived records may appear only if clearly marked.  
\- AI summaries must not appear as recent records.

\---

\#\# 9\. Needs Attention

Needs Attention highlights work that may require follow-up.

MVP candidates:

\- Overdue corrective actions.  
\- Open findings without corrective action linkage.  
\- Draft records older than a reasonable threshold.  
\- Records with validation gaps, if validation status exists.

\#\#\# Rules

\- Needs Attention must be based on explicit record state.  
\- Do not infer urgency through AI.  
\- Do not create regulatory or legal conclusions.  
\- Each item must link to a record or register.  
\- If no items need attention, show a calm empty state.

Recommended empty-state copy:

\> No immediate follow-up items found.

\---

\#\# 10\. Quick Start / Register Links

Quick Start links provide fast access to the main work areas.

| Label | Route |  
|---|---|  
| Locations | \`/operations/locations\` |  
| Processes | \`/operations/processes\` |  
| Chemicals | \`/hse/chemicals\` |  
| Hazards | \`/hse/hazards\` |  
| SEGs | \`/hse/segs\` |  
| Findings | \`/field/findings\` |  
| Corrective Actions | \`/actions/corrective-actions\` |

These links should match the side panel structure.

Do not include deferred features as Quick Start links.

\---

\#\# 11\. Local Data Status

Local Data Status communicates the basic health of local persistence.

MVP status examples:

| State | Meaning |  
|---|---|  
| Ready | Local database is available |  
| Loading | Local records are being queried |  
| Error | Local data could not be loaded |  
| Migration Required | Future state; schema update needed |  
| Backup Not Configured | Future state; backup plan not configured |

\#\#\# Rules

\- This region must not be noisy.  
\- It should not look like a cloud sync widget.  
\- It should reinforce local-first behavior.  
\- Error states must provide useful recovery direction.

\---

\#\# 12\. Empty State

The first-run dashboard must not look broken.

When no records exist, show:

\- Brief explanation of what OLUSO tracks.  
\- Links to create or open initial registers.  
\- No fake charts.  
\- No fake sample compliance data.

Recommended first-run copy:

\`\`\`text  
Start building your HSE backbone:  
1\. Add locations.  
2\. Add processes.  
3\. Add chemicals.  
4\. Add hazards.  
5\. Add findings and corrective actions as work begins.  
\`\`\`

The empty state should guide setup without forcing a wizard.

\---

\#\# 13\. Loading State

The dashboard must show a loading state while dashboard queries run.

Acceptable behavior:

\- Skeleton cards.  
\- Muted loading rows.  
\- Stable page layout while loading.

Do not flash empty states before loading completes.

\---

\#\# 14\. Error State

If dashboard data fails to load, the page must show a clear error state.

Error state should include:

\- Plain-language problem statement.  
\- Retry action, if available.  
\- Link to Settings or Data Recovery if those routes exist.  
\- No silent failure.

Recommended copy:

\> OLUSO could not load dashboard data from local storage.

The app must not display stale dashboard values as if they are current unless the UI clearly marks them as stale.

\---

\#\# 15\. Interaction Rules

\- Clicking a summary card navigates to its target register or filtered register view.  
\- Clicking a recent record opens the record detail route.  
\- Clicking a Quick Start link opens the relevant register.  
\- Dashboard widgets must not edit records inline.  
\- Dashboard widgets must not silently create records.  
\- Dashboard filters, if added later, must not change source records.

\---

\#\# 16\. Data Requirements

Dashboard data should be assembled from derived local queries.

Potential query outputs:

\`\`\`ts  
export interface DashboardSummary {  
  openCorrectiveActionCount: number;  
  draftRecordCount: number;  
  priorityFindingCount: number;  
  recentActivityCount: number;  
}

export interface DashboardRecentRecord {  
  id: string;  
  type: "location" | "process" | "chemical" | "hazard" | "seg" | "finding" | "corrective-action";  
  title: string;  
  status?: string;  
  updatedAt: string;  
  route: string;  
  archived?: boolean;  
}

export interface DashboardAttentionItem {  
  id: string;  
  type: "finding" | "corrective-action" | "draft" | "validation-gap";  
  title: string;  
  severity?: "low" | "medium" | "high";  
  route: string;  
  reason: string;  
}  
\`\`\`

These types are illustrative and may be refined during implementation.

\---

\#\# 17\. State Ownership

| State | Owner |  
|---|---|  
| Current route | Router |  
| Dashboard loading/error state | Dashboard data loader |  
| Summary counts | Derived from local persistence |  
| Recent records | Derived from local persistence |  
| Needs Attention items | Derived from explicit record state |  
| UI collapse/layout state | App shell/UI state |  
| Empty state | Derived from local record counts |

The dashboard must not own durable domain records.

\---

\#\# 18\. Accessibility Requirements

\- Page title must be exposed as the main heading.  
\- Cards must have accessible names.  
\- Clickable cards must behave like links or buttons consistently.  
\- Keyboard users must be able to reach all dashboard actions.  
\- Status values must not rely on color alone.  
\- Loading and error states must be announced appropriately where practical.

\---

\#\# 19\. Visual Guidance

The dashboard should be calm and dense.

Use:

\- Clear headings.  
\- Compact cards.  
\- Structured spacing.  
\- Muted secondary text.  
\- Status chips only where they help.  
\- Simple table/list surfaces for recent records.

Avoid:

\- Large hero banners.  
\- Decorative charts.  
\- Gamified metrics.  
\- Compliance-score tiles.  
\- Excessive badges.  
\- Empty decorative panels.

\---

\#\# 20\. Failure Modes

| Failure Mode | Severity | Required Handling |  
|---|---:|---|  
| Local database unavailable | High | Show dashboard error state and block fake data |  
| Summary count query fails | Medium | Show partial error for affected region |  
| Recent record target deleted | Medium | Hide item or show unavailable state |  
| Needs Attention logic overstates risk | High | Base only on explicit statuses, not inference |  
| Empty state appears during loading | Medium | Keep loading state distinct from true empty state |  
| Dashboard becomes feature dumping ground | High | Reject widgets not tied to MVP records |

\---

\#\# 21\. Non-Goals

The dashboard will not provide:

\- Full analytics.  
\- Compliance scoring.  
\- AI recommendations.  
\- Regulatory interpretation.  
\- Multi-user workload views.  
\- Cloud sync management.  
\- Training tracking.  
\- Permit tracking.  
\- Incident command features.  
\- Editable widgets.  
\- Enterprise KPIs.

\---

\#\# 22\. Verification Checklist

Before implementation is accepted, verify:

\- \[ \] \`/dashboard\` route renders inside the app shell.  
\- \[ \] Dashboard sidebar item is active on \`/dashboard\`.  
\- \[ \] Root route \`/\` redirects to \`/dashboard\` or otherwise lands consistently.  
\- \[ \] Summary cards display derived counts.  
\- \[ \] Summary cards link to appropriate registers.  
\- \[ \] Recent Records links open record detail routes.  
\- \[ \] Empty state works when no records exist.  
\- \[ \] Loading state does not flash empty state.  
\- \[ \] Error state appears if local data loading fails.  
\- \[ \] Dashboard does not expose deferred features.  
\- \[ \] Dashboard does not include compliance scoring or AI insight widgets.  
\- \[ \] Keyboard navigation works for all dashboard actions.  
\- \[ \] Screen-reader labels exist for actionable cards.

\---

\#\# 23\. Acceptance Criteria

This page spec is accepted when:

1\. The dashboard is defined as a landing and resume-work surface.  
2\. The dashboard does not become source truth.  
3\. Dashboard data is derived from durable local records.  
4\. The page provides access to recent records, open actions, incomplete work, priority findings, and local data status.  
5\. The page includes clear empty, loading, and error states.  
6\. The page avoids deferred enterprise, compliance, and AI features.  
7\. The page links users into registers and record detail routes without bypassing state-management protections.

\---

\#\# 24\. Final Decision Statement

The OLUSO dashboard will be a quiet operational landing page for resuming work and navigating into core registers.

It will summarize explicit local record state, show current work that needs attention, and provide fast register access. It will not become an analytics cockpit, AI assistant, compliance scoring surface, or enterprise dashboard.  
