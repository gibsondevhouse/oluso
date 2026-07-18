# Side panel specification

Status: Governing target
Last updated: 2026-07-18

## Purpose

Provide stable laptop-oriented navigation for the baseline, industrial-hygiene, assurance, exchange, reporting, and system workflows.

## Sections

```text
Dashboard
Baseline
Master Data
Industrial Hygiene
Assurance
Review Exchange
Reports
Future Modules
Settings
```

Child items are defined in [03-sidebar-navigation.md](../03-sidebar-navigation.md).

## Behavior

- Expanded/collapsed state may persist as a lightweight preference.
- Current route and ancestor section are visually and semantically identified.
- Counts show actionable gaps, reviews, conflicts, or due work only.
- Future Modules is collapsed by default and labeled deferred/legacy.
- Detail/create/edit/history routes select the owning section without appearing as primary items.
- On narrow windows the panel may become a modal drawer with focus management; the same routes and domain grouping remain.
- Works in browser and installed PWA without desktop-runtime APIs.

## Accessibility

- Use navigation landmarks and lists.
- Expand/collapse buttons expose `aria-expanded` and controlled region.
- Full keyboard navigation and visible focus.
- Drawer mode traps/restores focus and closes with Escape.
- Status/count meaning does not rely on color.

## Prohibited items

- Direct Tauri/native controls.
- Cloud-sync status/action.
- Every underlying table as a sidebar item.
- Deferred module counts in primary readiness.
- Duplicate routes for the same canonical entity.
