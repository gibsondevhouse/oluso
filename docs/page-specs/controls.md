# Controls Page Specification

This specification describes the **Controls** page of **Olùṣọ́**, where engineering and administrative controls, personal protective equipment (PPE), and other mitigation measures are recorded, reviewed, and managed.

## Purpose

Effective hazard control is foundational to an industrial hygiene program.  This page enables workers and HSE coordinators to catalogue implemented controls, assess their effectiveness, and identify gaps.  Linking controls to hazards provides traceability and supports compliance reporting.

## Layout

1. **Page Header**
   - Title: “Controls”.
   - Search & Filter component: allows filtering by hazard, control type, effectiveness rating, and location.
   - Action buttons: “Add Control” (primary) and “Export” (secondary).

2. **Controls Table**
   - Columns: Control ID (link), Hazard, Type, Description, Effectiveness, Created, Updated.
   - Control Type is displayed as a colored badge (e.g. engineering = blue, administrative = orange, PPE = green).  Unknown or other types use a neutral grey.
   - Row actions: “View Details” and “Edit/Delete”.
   - Sorting: by Hazard name, Type, Effectiveness, or Creation date.

3. **Detail Drawer**
   - Opens from the right on selecting “View Details”.
   - Displays full control record including hazard context, references to industry standards (e.g. ANSI, ISO), installation date, and any inspection history.
   - Provides quick links to the hazard and exposure monitoring pages.
   - Includes an “Effectiveness History” chart showing changes over time (e.g. after maintenance or upgrades).

## Add/Edit Control Modal

- **Fields**:
  - Hazard (dropdown; required).  Searchable list of hazards; selecting a hazard sets default effectiveness based on hazard severity.
  - Control Type (dropdown; required).  Options: engineering, administrative, PPE, substitution, other.
  - Description (multiline text; required).  Explain the control measure.
  - Effectiveness (select; required).  Options: high, medium, low.  Use quantitative values if available.
  - Installation Date (date picker; optional).  When the control was implemented.
  - Review Date (date picker; optional).  Next scheduled evaluation.
- **Validation**: Required fields must be provided; installation date cannot be after review date.
- **Logic**: When editing, prefill fields with existing values.  Updating effectiveness should update associated hazard risk scores.

## Data Interactions

- **List**: Use `ControlRepository.list_by_hazard` or `list(filters)` depending on filter context.
- **Create**: `ControlRepository.create` with data; recalculate hazard risk if appropriate.
- **Update**: `ControlRepository.update`; re‑evaluate hazard risk if effectiveness changes.
- **Delete**: `ControlRepository.delete` (soft delete).  Ask confirmation; warn if removing the last control on a hazard.

## States

| State        | Description                                                          |
|--------------|----------------------------------------------------------------------|
| Empty        | No controls recorded; show call to action to add the first control.   |
| Loading      | Data fetch in progress; show skeleton rows.                           |
| Error        | Repository error; show error state with retry button.                 |
| No Results   | Filters/search returned no records; show appropriate message.         |

## Compliance and Effectiveness

- Link controls to hazard control hierarchy: elimination, substitution, engineering, administrative, PPE.  The UI should encourage selecting higher order controls where feasible.
- Show regulatory references or internal policies relevant to the selected control type.  For example, linking to OSHA 29 CFR 1910 for machine guarding.
- Allow attaching supporting documents (e.g., inspection certificates) via Google Drive integration.

## Testing

- Verify filtering by hazard, control type, and effectiveness produces correct subsets.
- Test adding, editing, and deleting controls; ensure hazard risk scores update when effectiveness changes.
- Confirm that deletion of all controls for a hazard triggers a warning.
- Ensure accessibility: keyboard navigation through table and modals; screen reader announcements for badges and statuses.