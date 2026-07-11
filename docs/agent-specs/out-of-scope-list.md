# Out‑of‑Scope List

## Purpose

Enumerate features and tasks that are explicitly excluded from the current phase of OLUSO implementation (MVP).  Agents must not implement or design these items until they are brought into scope through updated documentation and project planning.

## Excluded Features

* **Attachments & Evidence Storage** — Including uploading, storing and linking photos, files or scans.  Requires ADR‑0006 and associated specs.
* **AI Assistance or Recommendations** — Any features that use AI/ML to generate recommendations, perform inspections or auto‑fill forms.  Requires ADR‑0008 and further planning.
* **Mobile App or Responsive Mobile Layout** — OLUSO is a desktop application for MVP.  Mobile adaptations are deferred.
* **Cloud Synchronisation** — Syncing data between devices or cloud backups.  The current scope is local‑first only.
* **User Account Management & Authentication** — Multi‑user logins, permissions and roles beyond simple local usage.
* **Enterprise Admin Features** — Bulk user management, audit portal, SSO integration.
* **Compliance Calendar & Training Modules** — Scheduling compliance events and managing training programmes.
* **Permit Management** — Handling permits, licenses or regulatory approvals.
* **Incident Investigation Suite** — Full incident management beyond simple findings and corrective actions.
* **Contractor Management** — Modules for managing contractors and vendors.
* **Audit Portal** — External portal for auditors to access data.
* **Analytics Dashboard Beyond MVP Metrics** — Advanced reporting dashboards with charts and KPIs beyond simple counts.
* **Third‑Party Integrations** — Integration with external systems (SAP, ERP) or APIs.
* **Internationalisation & Localisation** — Multi‑language support; currently assume English only.

## Usage

If a proposed implementation touches any items listed here, the agent must pause and seek clarification from the product owner.  Implementation prompts should include relevant items from this list in the “Out‑of‑Scope Items” section to remind agents of exclusions.