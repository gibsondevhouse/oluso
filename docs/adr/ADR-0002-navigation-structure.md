# ADR-0002 — Navigation structure

Status: Accepted, amended
Amended: 2026-07-18

## Decision retained

ADAMA HSE uses stable, conservative primary navigation with a persistent left sidebar on laptop-sized displays. Top-level entries represent major workflow/domain destinations, while detail, create, edit, history, recovery, and conflict-resolution routes remain contextual.

## Amendment

The former broad OLUSO domain map and native-desktop framing are superseded. Current top-level areas are:

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

The sidebar adapts to a drawer on narrow browser windows and works identically in a normal browser/PWA. Future Modules is collapsed and does not contribute readiness counts.

## Consequences

- Workflow gaps/reviews/conflicts/due work may show actionable badges.
- Underlying tables do not automatically receive primary navigation.
- Baseline and exposure scenarios are promoted over broad campaign families.
- Legacy routes may remain during migration without target-navigation status.

Detailed contract: [03-sidebar-navigation.md](../03-sidebar-navigation.md) and [09-routing.md](../09-routing.md).
