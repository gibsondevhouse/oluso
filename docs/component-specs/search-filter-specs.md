# Search & Filter Component Specification

This document describes the search and filter component used throughout **ADAMA HSE** to locate records within registers. The component must provide a consistent experience across all pages while remaining accessible and performant.

## Purpose

Workers need to quickly find records in large registers (e.g., chemicals, hazards, processes).  A unified search & filter panel reduces cognitive load and ensures discoverability across different modules.

## Overview

The component comprises three elements:

1. **Search Bar** — a text input for free‑form search terms.
2. **Filter Chips** — a set of tokens representing applied filters with the ability to remove them individually.
3. **Filter Drawer** — a collapsible panel with structured filter options (checkboxes, dropdowns, sliders) specific to the current register.

## Behaviour

### Search Bar

- **Location**: Top of the page header, aligned with the title.
- **Placeholder**: “Search records…”
- **Debounce**: Invoke search after 300 ms of inactivity to avoid excessive queries.
- **Keyboard**: Pressing `Enter` triggers immediate search.  `Esc` clears the input.
- **Clear Button**: A small icon inside the input removes the current text.
- **Accessibility**: Screen readers announce “Search records edit. Type and press Enter to search.”
- **No Results**: Display “No records match your search” with a suggestion to broaden terms.
- **Errors**: If the search service fails, show a toast notification with an error message and allow retry.

### Filter Chips

- **Creation**: Each applied filter generates a chip showing the filter label and value (e.g. “Hazard Type: Chemical”).
- **Removal**: Users can remove a single filter via the `x` icon on the chip.  Removing resets the corresponding filter control.
- **Overflow**: When chips exceed the header width, allow horizontal scrolling or wrap to a second line.
- **Persistence**: Chips persist across pagination but reset on page navigation.

### Filter Drawer

- **Toggle**: Hidden by default; revealed by clicking a “Filter” button adjacent to the search bar.  When open, it pushes the content down rather than overlaying it.
- **Sections**: Filters are grouped into logical sections (e.g., “Type”, “Status”, “Date Range”).
- **Controls**: Use appropriate controls for each field:
  - Checkboxes for multi‑select enumerations.
  - Radio buttons for single‑select enumerations.
  - Dropdowns for reference lists (locations, processes, hazards).
  - Date pickers for start/end range filters.
- **Apply & Reset**: Provide buttons at the bottom of the drawer: “Apply Filters” triggers a new list query; “Reset” clears all selections.
- **Accessibility**: Drawer is focus‑trap; hitting `Esc` closes it.  Use ARIA labels on all controls.

## API Interaction

- Search and filter parameters are sent to the repository layer via query objects.  The UI must not construct SQL or direct database queries.
- Filters must be namespaced by entity field to avoid collisions (e.g. `hazard_type=chemical` vs `process_type=chemical`).
- The component must handle slow responses gracefully: show a loading indicator in the table; disable the search input and filter controls while waiting.

## States

| State          | Description                                                |
|----------------|------------------------------------------------------------|
| Idle           | No search term or filters applied; list shows default sort.|
| Searching      | User is typing; debounce timer active.                     |
| Filtering      | User has opened the filter drawer and selected criteria.   |
| Loading        | Awaiting response from repository; show spinner in table.   |
| No Results     | No records match the search and filter combination.         |
| Error          | Repository/query/storage error; display an actionable message. |

## Visual Style

- Use the primary accent color for the search bar outline when focused.
- Chips use the secondary color with white text and a subtle shadow.
- Filter drawer has a light background with section headings in bold.
- Spacing and sizing align with the overall design principles (see `06-design-principles.md`).

## Extensibility

Future registers may require additional filter types (e.g., numeric range sliders).  The component must allow injection of custom filter controls via a configuration object.  Do not hard‑code filter logic in the component; rely on metadata from the page specification.
