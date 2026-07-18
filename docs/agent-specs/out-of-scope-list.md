# Current out-of-scope list

Last updated: 2026-07-18

Do not implement these without updated scope and, where noted, a new ADR:

- New generic campaign-register families.
- Automatic cloud/OneDrive sync or remote source-of-truth data.
- Real-time collaboration.
- SaaS backend, multi-tenancy, billing, or enterprise administration.
- Authentication/SSO/permissions beyond explicit local actor identity.
- Clinical medical data, diagnoses, results, or notes.
- Automated legal/compliance conclusions or professional exposure determinations.
- A second production persistence/runtime architecture.
- `localStorage` as the primary database.
- Full LMS/training, complex MOC/PSSR, environmental/waste, permit, contractor, and broad compliance-calendar modules.
- Mobile-first application redesign.
- Unmanaged binary attachment/document-management platform.
- Advanced analytics not tied to actionable baseline/exposure/control work.

Migration readers, Future Module boundaries, and historical views are allowed when they directly support the reset; they do not reactivate the underlying module.

Cloud sync, clinical data, a backend, a second runtime, or automated judgment require an intended-use update and new ADR before implementation.
