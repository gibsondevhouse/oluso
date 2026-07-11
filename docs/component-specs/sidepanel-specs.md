
sidepanel-specs.corrected.md

Page
1
/
1
100%
# sidepanel-specs.md

Project: OLUSO  
Status: Draft  
Last Updated: 2026-07-06  
Owner: Product / UI Architecture  
Related Documents: 03-sidebar-navigation.md, 09-routing.md, ADR-0002-navigation-structure.md, ADR-0003-registers-vs-records.md, 11-state-management.md

---

## 1. Purpose

This document defines the OLUSO side panel component specification.

The side panel is the primary desktop navigation surface for OLUSO. It must provide stable, domain-aligned access to the application’s major MVP areas without becoming cluttered, decorative, or feature-bloated.

This spec translates the navigation architecture into implementation guidance: component structure, data shape, active-route behavior, collapsed/expanded states, keyboard behavior, accessibility, disabled states, and acceptance criteria.

---

## 2. Component Objective

Build a persistent left-side navigation panel that allows the user to move between OLUSO’s major MVP work areas.

The component must support:

- Clear product identity.
- Stable section grouping.
- Register-first navigation.
- Active route indication.
- Collapsed and expanded states.
- Section expansion/collapse.
- Disabled or deferred item behavior if needed.
- Keyboard-accessible navigation.
- Screen-reader compatible labeling.
- Predictable behavior during route changes and unsaved-form protection.

The side panel must feel like a production app shell, not a prototype menu.

---

## 3. Design Intent

The side panel should feel:

- Durable.
- Quiet.
- Operational.
- Dense but readable.
- Modern without being flashy.
- Familiar to users of tools like Notion, GitHub, and professional desktop applications.

Avoid:

- Excessive color.
- Decorative navigation labels.
- Novelty icons.
- Floating experimental menus.
- Over-animated interactions.
- Sidebar links for every future feature.
- AI-first navigation.
- Document-library-first navigation.
- Enterprise EHS suite sprawl.

---

## 4. Baseline Navigation Tree

The MVP side panel uses this structure:

```text
OLUSO
├── Dashboard
├── Operations
│   ├── Locations
│   └── Processes
├── HSE Registers
│   ├── Chemicals
│   ├── Hazards
│   └── SEGs
├── Field Work
│   └── Findings
├── Actions
│   └── Corrective Actions
├── Reports
│   └── Exports
└── System
    └── Settings
```

This is the baseline component contract. Changes require page-spec or ADR justification.

---

## 5. Sidebar Data Contract

The side panel should be driven from a typed navigation configuration, not hardcoded across multiple components.

```ts
export type SidebarRouteType =
  | "landing"
  | "register"
  | "report"
  | "system";

export type SidebarItemStatus =
  | "active"
  | "available"
  | "disabled"
  | "deferred";

export interface SidebarItem {
  id: string;
  title: string;
  route: string;
  icon?: string;
  routeType: SidebarRouteType;
  status?: SidebarItemStatus;
  badge?: number;
  description?: string;
}

export interface SidebarSection {
  id: string;
  title: string;
  icon?: string;
  collapsible: boolean;
  defaultExpanded: boolean;
  children: SidebarItem[];
}

export interface SidebarConfig {
  appTitle: string;
  sections: SidebarSection[];
}
```

### Contract Rules

- `id` values must be stable.
- `route` values must match the routing contract.
- `title` values must be boring operational labels.
- `badge` values are optional and must come from derived state, not arbitrary component state.
- `status: "deferred"` may be used only when the UI clearly communicates that the route is not implemented.
- Detail, create, and edit routes must not appear as sidebar items.

---

## 6. MVP Sidebar Config

```ts
export const SIDEBAR_CONFIG: SidebarConfig = {
  appTitle: "OLUSO",
  sections: [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "LayoutDashboard",
      collapsible: false,
      defaultExpanded: true,
      children: [
        {
          id: "dashboard-home",
          title: "Dashboard",
          route: "/dashboard",
          icon: "LayoutDashboard",
          routeType: "landing",
        },
      ],
    },

    {
      id: "operations",
      title: "Operations",
      icon: "Factory",
      collapsible: true,
      defaultExpanded: true,
      children: [
        {
          id: "locations",
          title: "Locations",
          route: "/operations/locations",
          icon: "MapPinned",
          routeType: "register",
        },
        {
          id: "processes",
          title: "Processes",
          route: "/operations/processes",
          icon: "Workflow",
          routeType: "register",
        },
      ],
    },

    {
      id: "hse-registers",
      title: "HSE Registers",
      icon: "ShieldAlert",
      collapsible: true,
      defaultExpanded: true,
      children: [
        {
          id: "chemicals",
          title: "Chemicals",
          route: "/hse/chemicals",
          icon: "FlaskConical",
          routeType: "register",
        },
        {
          id: "hazards",
          title: "Hazards",
          route: "/hse/hazards",
          icon: "TriangleAlert",
          routeType: "register",
        },
        {
          id: "segs",
          title: "SEGs",
          route: "/hse/segs",
          icon: "UsersRound",
          routeType: "register",
        },
      ],
    },

    {
      id: "field-work",
      title: "Field Work",
      icon: "ClipboardCheck",
      collapsible: true,
      defaultExpanded: false,
      children: [
        {
          id: "findings",
          title: "Findings",
          route: "/field/findings",
          icon: "ClipboardList",
          routeType: "register",
        },
      ],
    },

    {
      id: "actions",
      title: "Actions",
      icon: "CheckSquare",
      collapsible: true,
      defaultExpanded: true,
      children: [
        {
          id: "corrective-actions",
          title: "Corrective Actions",
          route: "/actions/corrective-actions",
          icon: "ListChecks",
          routeType: "register",
        },
      ],
    },

    {
      id: "reports",
      title: "Reports",
      icon: "FileBarChart",
      collapsible: true,
      defaultExpanded: false,
      children: [
        {
          id: "exports",
          title: "Exports",
          route: "/reports/exports",
          icon: "FileOutput",
          routeType: "report",
        },
      ],
    },

    {
      id: "system",
      title: "System",
      icon: "Settings",
      collapsible: true,
      defaultExpanded: false,
      children: [
        {
          id: "settings",
          title: "Settings",
          route: "/system/settings",
          icon: "Settings",
          routeType: "system",
        },
      ],
    },
  ],
};
```

---

## 7. Explicitly Excluded from MVP Sidebar

The following must not appear in primary MVP sidebar navigation:

- Equipment.
- SDS Library.
- Exposure Limits.
- Risk Assessments.
- Controls.
- Observations as a separate top-level item.
- Inspections.
- Audits.
- Air Sampling.
- Incidents.
- Near Misses.
- Investigations.
- Compliance.
- Training.
- Permits.
- Regulatory Calendar.
- Documents.
- AI Assistant.
- Cloud Sync.
- User Accounts.
- Enterprise Admin.
- Audit Portal.

These may be future roadmap candidates, but they are not approved primary navigation for MVP.

---

## 8. Component Layout

The side panel should contain:

1. App identity/header.
2. Optional collapse/expand control.
3. Navigation section list.
4. Navigation items.
5. Optional bottom system area.
6. Optional app/version/status footer.

Recommended structure:

```text
aside.SidePanel
├── header.SidePanelHeader
│   ├── AppMark
│   ├── AppTitle
│   └── CollapseButton
├── nav.SidePanelNav
│   └── SidebarSection[]
└── footer.SidePanelFooter
    └── AppStatus / Version / Local-first indicator
```

Footer content is optional for MVP. Do not add footer clutter without a clear use.

---

## 9. Visual States

Each sidebar item must support:

| State | Meaning |
|---|---|
| Default | Available route, not active |
| Hover | Pointer is over item |
| Focus | Keyboard focus is on item |
| Active | Current route belongs to item |
| Disabled | Not clickable |
| Deferred | Visible but intentionally unavailable |
| Badge | Optional derived count |
| Collapsed | Icon-only or compact state |

### Active State Rule

Active state must be derived from the current route.

Example behavior:

| Current Route | Active Sidebar Item |
|---|---|
| `/hse/chemicals` | Chemicals |
| `/hse/chemicals/new` | Chemicals |
| `/hse/chemicals/:chemicalId` | Chemicals |
| `/hse/chemicals/:chemicalId/edit` | Chemicals |
| `/operations/locations/:locationId` | Locations |
| `/actions/corrective-actions/:actionId` | Corrective Actions |

Active state must not depend on page-local state.

---

## 10. Section Expansion Rules

- Sections with `collapsible: false` must always render open.
- Sections with `collapsible: true` may be expanded or collapsed.
- `defaultExpanded` controls initial state only.
- User-changed expansion state may be stored as local UI preference.
- If a child route is active, its parent section must render expanded even if previously collapsed.
- Collapsed section state must not hide the user’s current location.

---

## 11. Panel Collapse Rules

The entire side panel may support expanded and collapsed modes.

### Expanded Mode

Expanded mode displays:

- App title.
- Section titles.
- Item labels.
- Icons.
- Badges, if present.
- Collapse control.

### Collapsed Mode

Collapsed mode may display:

- App mark.
- Item icons.
- Tooltips or accessible labels.
- Active indicator.
- Expand control.

Collapsed mode must remain usable by keyboard and screen reader.

Collapsed mode must not remove navigation capability.

---

## 12. Interaction Rules

### Click / Pointer

- Clicking an available item navigates to its route.
- Clicking a disabled or deferred item does not navigate.
- Clicking a section header toggles the section only if collapsible.
- Clicking a route item should not toggle the parent section.

### Keyboard

Minimum keyboard support:

- `Tab` moves through interactive controls.
- `Enter` activates focused navigation item.
- `Space` toggles collapsible section headers.
- `ArrowDown` / `ArrowUp` may move through nav items if roving focus is implemented.
- `Escape` should not close the side panel on desktop unless a temporary overlay mode exists.

### Unsaved Changes

When the current page has unsaved changes:

- Navigation must trigger the app’s unsaved-change guard.
- The side panel must not bypass form protection.
- If navigation is cancelled, the current active item remains unchanged.
- If navigation proceeds, the target route becomes active after route change completes.

---

## 13. Accessibility Requirements

The side panel must use semantic navigation structure.

Minimum requirements:

- Use `<aside>` for the panel shell.
- Use `<nav aria-label="Primary navigation">` for navigation.
- Section toggle buttons must expose `aria-expanded`.
- Active items should expose `aria-current="page"` where appropriate.
- Icon-only collapsed mode must provide accessible labels.
- Disabled/deferred items must communicate unavailable state.
- Focus indicators must be visible.
- Keyboard-only navigation must work.

Do not rely on color alone for active state.

---

## 14. State Ownership

The side panel uses UI state only.

| State | Owner | Durable? |
|---|---|---:|
| Current route | Router | No |
| Active item | Derived from route | No |
| Expanded sections | UI preference/local state | Optional |
| Panel collapsed state | UI preference/local state | Optional |
| Badges/counts | Derived application state | No |
| Disabled/deferred status | Navigation config | No |

The side panel must not own domain data.

It may display counts or badges, but those counts must come from domain/query state owned elsewhere.

---

## 15. Badge Rules

Badges are allowed but should be used sparingly.

Acceptable MVP candidates:

- Open corrective action count.
- Draft record count.
- Overdue corrective action count.
- Failed local sync/import count if future functionality exists.

Badges must be:

- Derived from source records or application state.
- Non-authoritative.
- Safe to omit without breaking navigation.
- Not manually edited inside the side panel component.

---

## 16. Error and Empty Behavior

The side panel should remain available during most application errors.

### Route Error

If the current route fails:

- Keep the side panel visible.
- Keep the parent register active if route hierarchy is known.
- Show page-level error in the main content area.

### Missing Record

If a detail route points to a missing record:

- Keep the parent register active.
- Allow the user to return to the parent register.
- Do not remove the sidebar or change active state to generic error unless necessary.

### Config Error

If navigation config is malformed during development:

- Fail visibly.
- Do not silently render incomplete navigation.
- Tests should catch invalid route, missing ID, duplicate ID, or missing title.

---

## 17. Component Boundaries

The side panel component may contain:

- Panel shell.
- Header.
- Section component.
- Item component.
- Collapse button.
- Badge display.
- Tooltip support.
- Accessibility attributes.

The side panel component must not contain:

- Page content.
- Record loading logic.
- Database calls.
- AI calls.
- Compliance interpretation.
- Report generation.
- Form save logic.
- Route definitions scattered across unrelated components.

---

## 18. Recommended File Structure

Recommended implementation structure:

```text
src/
└── lib/
    └── navigation/
        ├── sidebar.config.ts
        ├── sidebar.types.ts
        ├── sidebar.utils.ts
        └── sidebar.test.ts

src/
└── components/
    └── layout/
        └── SidePanel/
            ├── SidePanel.svelte
            ├── SidePanelSection.svelte
            ├── SidePanelItem.svelte
            └── SidePanel.types.ts
```

Adjust paths to match the selected app framework and repo conventions.

---

## 19. Utility Requirements

Implement utility behavior outside the rendering component.

Recommended utilities:

```ts
export function getActiveSidebarItemId(
  pathname: string,
  config: SidebarConfig,
): string | null {
  // Derive active item from route hierarchy.
  // Detail, create, and edit routes map back to parent register.
}

export function getExpandedSectionIds(
  pathname: string,
  config: SidebarConfig,
  userExpandedState: Record<string, boolean>,
): string[] {
  // Active section must remain expanded.
}

export function validateSidebarConfig(config: SidebarConfig): void {
  // Catch duplicate IDs, missing titles, missing routes, and invalid section shape.
}
```

These should be tested.

---

## 20. Testing Requirements

Minimum tests:

- Sidebar config has no duplicate section IDs.
- Sidebar config has no duplicate item IDs.
- Every item has a title.
- Every item has a route.
- Every item has a valid route type.
- Active state maps register routes correctly.
- Active state maps detail routes to parent register.
- Active state maps create/edit routes to parent register.
- Active parent section expands automatically.
- Deferred items do not navigate.
- Disabled items do not navigate.
- Unsaved-change guard is called before navigation when dirty.
- Collapsed panel still exposes accessible labels.

---

## 21. Acceptance Criteria

The side panel is acceptable when:

1. It renders the approved MVP navigation tree.
2. It does not include deferred enterprise/compliance/incident/document-library sections.
3. It supports expanded and collapsed panel modes.
4. It supports collapsible sections.
5. It derives active state from the current route.
6. Detail/create/edit routes activate the parent register item.
7. It remains visible during page-level errors.
8. It supports keyboard navigation.
9. It exposes appropriate accessibility labels and current-page state.
10. It does not own domain data.
11. It does not bypass unsaved-change protection.
12. Its config and active-route utilities are covered by tests.

---

## 22. Out of Scope

This spec does not implement:

- Mobile navigation.
- Role-based navigation.
- User-specific navigation customization.
- Cloud-configured navigation.
- AI assistant entry point.
- Compliance suite navigation.
- Incident management suite navigation.
- Document library navigation.
- Full dashboard behavior.
- Page-level register design.
- Database schema.

---

## 23. Final Implementation Rule

The side panel is an app-shell component.

It exists to expose the approved OLUSO product structure, not to advertise future scope. If a navigation item does not map to an approved MVP register, workflow area, report surface, or system surface, it does not belong in the primary side panel.
Displaying sidepanel-specs.corrected.md.