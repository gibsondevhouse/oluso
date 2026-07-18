# Settings and diagnostics page specification

Status: Governing target
Routes: `/settings`, `/settings/identity`, `/settings/storage`, `/settings/backups`, `/settings/diagnostics`
Last updated: 2026-07-18

## Identity

- Dataset ID and current dataset revision (read-only except controlled dataset creation/restore).
- Installation ID (read-only after initialization).
- Local user/person identity used for attribution.
- Schema and application version.

## Storage

- IndexedDB availability/open state.
- Browser storage estimate/quota where available.
- Persistent-storage request/status where supported, described without guarantees.
- Last successful write and migration status.
- Supported-browser/PWA/offline readiness.

No native database path or desktop runtime file-path setting is shown.

## Backup

- Last verified backup time/revision.
- Changes since backup.
- Create full backup.
- Validate/restore backup.
- Clear warning that browser downloads and external retention are user/corporate responsibilities.

## Exchange

- Last exported/imported package metadata.
- Unresolved conflicts/import failures.
- Link to Review Exchange; settings does not perform silent sync.

## Diagnostics

- Database/schema/store health summary.
- Blocked upgrade/version-change state.
- Storage/quota warnings.
- Migration/import/backup failures with safe diagnostic export.
- Service-worker/update state.

## Destructive actions

Reset/replace/delete-local-data actions require exact dataset identification, current verified backup, impact summary, and explicit confirmation. They are separate from preference reset.

## Acceptance criteria

- User can identify who/which installation/dataset will author an exchange.
- Storage failure is visible and actionable.
- Backup and exchange remain distinct.
- Settings work in browser and installed PWA without Tauri APIs.
