# System Settings Page Spec

## Purpose

Provide a central location where administrators can configure application‑wide settings.  These settings control behaviour such as default values, appearance preferences, data export directories, and user preferences.  The system settings page should be carefully scoped to avoid feature bloat and should not expose dangerous configurations to casual users.

## Route

`/system/settings`

## Sidebar Parent

“System” group → “Settings” item.

## Domain Owner

System/Administration Domain.

## Data Source

Settings are stored in a `settings` table or configuration file within the local persistence layer.  Each setting record includes:

* `key` (string)
* `value` (string/json)
* `category` (string) — grouping (e.g. Appearance, Data, Notifications)
* `description` (string)
* `editable` (boolean) — whether the user can change it.

Some settings may be stored outside the database (e.g. file paths).  These are accessed via the desktop runtime API.

## Primary User Tasks

* View current system settings and understand their impact.
* Edit editable settings, such as default export directory, UI theme (light/dark), and date/time format.
* Reset settings to defaults.
* Save settings and observe changes immediately (where applicable).

## Page Regions

1. **Page Header** — “System Settings” with description.  May include actions like “Reset to Defaults”.
2. **Settings Categories** — list or tabs representing categories: Appearance, Data & Storage, Notifications, Export, Misc.
3. **Settings Form** — for the selected category, display form inputs for each setting:
   * **Appearance** — UI theme (light/dark/system), accent colour.
   * **Data & Storage** — default database location (display only), export directory (choose via file picker), auto‑backup frequency.
   * **Notifications** — enable/disable certain in‑app notifications.
   * **Export** — default file format, include archived records by default.
   * **Misc** — any additional settings.
4. **Save Button** — applies changes.  Disabled if no changes.
5. **Reset Button** — resets selected category or all settings to defaults (with confirmation).

## Behaviour

* Settings are loaded on page load and populate the form.  Changes are tracked locally until the user clicks Save.
* Save writes changes to the `settings` table or config file and applies them immediately (e.g. changes theme without reload).
* Reset triggers a confirmation dialog; on confirm, resets the selected category or all settings to factory defaults.
* Some settings (e.g. database location) are read‑only and displayed for information only.

## States

* **Loading** — while settings are being loaded, display skeleton inputs or a spinner.
* **Error** — if settings cannot be loaded or saved (e.g. permission issues), display an error banner with retry.
* **Dirty** — when the user has unsaved changes, enable the Save button and warn before navigating away.

## Record Relationships

None.  Settings are not related to other registers.

## Accessibility Expectations

* Form fields have descriptive labels and helper text.  File picker buttons announce the selected path.
* Tabs or categories are keyboard navigable.  The Save and Reset buttons are focusable and have clear labels.

## Acceptance Criteria

* Settings load correctly on page load and reflect current values.
* Users can edit and save settings; changes persist and apply immediately where applicable.
* Reset confirms before discarding changes and restores defaults.
* The page handles errors gracefully and meets accessibility standards.