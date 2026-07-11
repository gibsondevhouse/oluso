# ADR-0001 — Local-First Architecture

Project: OLUSO  
Status: Accepted  
Last Updated: 2026-07-06  
Decision Owner: Product / Architecture  
Related Documents: 01-product-vision, 07-build-plan, 08-scope-boundaries, 11-state-management, 12-future-roadmap

---

## 1. Purpose

This Architecture Decision Record defines OLUSO’s local-first architecture decision.

The purpose of this document is to lock the application’s primary technical posture before implementation begins. OLUSO must not drift into a cloud-first SaaS product, enterprise EHS platform, shared workspace, generic document system, or AI-dependent compliance tool.

This ADR establishes that OLUSO’s primary source of truth is local, durable, user-controlled storage on the user’s machine.

---

## 2. Decision Summary

OLUSO will be designed as a local-first desktop application.

For the MVP, structured HSE records will be stored locally, remain usable offline, and will not depend on cloud accounts, remote APIs, multi-user infrastructure, or external synchronization services.

Local persistence is the system of record.

Frontend state, cached views, imported files, AI outputs, generated summaries, and exports are not the source of truth unless explicitly written into the local persistence layer through controlled application workflows.

---

## 3. Context

OLUSO is being designed as a focused HSE, environmental, chemical safety, industrial hygiene, field-work, corrective action, and compliance-supporting desktop application.

The app needs to preserve structured records that may support operational decisions, audits, exposure assessments, corrective actions, and future review. That means the architecture must prioritize:

- Durable local records.
- Offline usability.
- Clear ownership of data.
- Predictable record changes.
- Explicit save and edit behavior.
- Recoverability after failure.
- Maintainable schema evolution.
- Minimal infrastructure burden.
- Controlled product scope.

Cloud-first architecture would add premature complexity: authentication, hosting, subscriptions, remote authorization, synchronization, account recovery, server-side security, deployment operations, vendor risk, and multi-user conflict resolution.

Those concerns may be valid for a future product stage, but they are not appropriate for the OLUSO MVP.

---

## 4. Decision

OLUSO will use a local-first architecture for MVP.

The application must be usable without internet access. The user must be able to open the app, view records, create records, edit records, close actions, and export information without a network connection.

The MVP will not require:

- User accounts.
- Login screens.
- Cloud sync.
- SaaS hosting.
- Remote databases.
- Multi-user collaboration.
- Organization-level administration.
- Subscription billing.
- Web deployment.
- Cloud-based source-of-truth records.

The initial persistence recommendation is a local SQLite-backed data layer, subject to later implementation-level confirmation. Any alternate local database must satisfy the same requirements: durability, migration support, queryability, backup/export viability, and predictable failure handling.

---

## 5. Decision Drivers

### 5.1 Field usability

HSE work cannot depend on ideal network conditions. A field-usable app must support work in offices, plants, storage areas, mechanical rooms, field locations, temporary workspaces, and travel contexts where connectivity may be weak, restricted, or unavailable.

### 5.2 Data ownership

The user must retain direct control over the working data. OLUSO records should not become inaccessible because of a server outage, expired account, vendor lock-in, broken API, or cloud billing issue.

### 5.3 Scope discipline

OLUSO’s MVP must prove the structured HSE backbone before expanding. Cloud architecture would force the product to solve platform problems before proving core domain value.

### 5.4 Maintainability

A single-user local desktop architecture reduces operational burden. There is no backend service to deploy, monitor, patch, scale, or secure during MVP.

### 5.5 Record defensibility

HSE records need predictable persistence, version-aware schema changes, and controlled update paths. Local-first architecture makes data flow easier to reason about during early development.

### 5.6 Privacy and sensitivity

Facility, chemical, exposure, hazard, and corrective-action data may be sensitive. Keeping the MVP local reduces unnecessary exposure of operational information.

---

## 6. Architecture Implications

### 6.1 Local persistence is mandatory

The application must have a durable local persistence layer. In-memory state is not sufficient. Browser-local temporary state is not sufficient. Export files are not sufficient as the primary data store.

### 6.2 SQLite is the preferred starting point

SQLite is the preferred default persistence option for the MVP because it is local, durable, queryable, mature, portable, and appropriate for a single-user desktop application.

This ADR does not define the full schema. It does, however, require that the selected persistence approach support structured records, relationships, migrations, and reliable backup/export workflows.

### 6.3 The data layer must be explicit

Records must be created, updated, archived, and deleted through explicit application services or repository functions. Random components should not write directly to persistence.

The app should avoid hidden data mutation.

### 6.4 Frontend state is not source truth

Frontend stores may hold temporary UI state, selected records, filters, form drafts, navigation state, and optimistic updates. They must not be treated as durable source truth.

Durable records must be read from and written to local persistence.

### 6.5 AI is not source truth

AI may assist with drafting, summarizing, classification suggestions, or workflow guidance in a later phase. AI output must not become an authoritative record unless the user explicitly reviews and commits it into the local data layer.

AI must not silently create, modify, close, or delete HSE records.

### 6.6 Files are supporting artifacts

Imported documents, SDS files, photos, inspection attachments, exports, and generated reports may support records. They are not a replacement for structured domain records.

If attachments are supported, the app must define whether they are copied into an app-controlled local storage area, referenced by file path, or both.

### 6.7 Migrations are required

The local database schema must be versioned. Any schema change must have a migration path.

The application must not rely on destructive resets once real user data exists.

### 6.8 Backup and export are product requirements

A local-first app must eventually support user-controlled backup and export. MVP does not need a polished backup system on day one, but the architecture must not block it.

Export must be treated as a controlled output, not as the primary source of truth.

---

## 7. Explicit Non-Goals

The MVP will not include:

- Cloud-hosted user accounts.
- Real-time collaboration.
- Multi-tenant organizations.
- Admin dashboards.
- Role-based enterprise permissions.
- SaaS deployment.
- Mobile sync.
- Browser-first operation.
- Cross-device conflict resolution.
- Remote audit portals.
- Vendor/customer access.
- Enterprise reporting suites.
- Automated regulatory interpretation.
- AI-controlled recordkeeping.

These may be revisited only through later ADRs and roadmap decisions.

---

## 8. Consequences

### 8.1 Benefits

Local-first architecture gives OLUSO:

- Lower infrastructure burden.
- Faster MVP delivery.
- Offline usability.
- Clear data ownership.
- Reduced cloud security exposure.
- Simpler deployment.
- Better alignment with a single-user desktop workflow.
- Stronger control over durable HSE records.

### 8.2 Tradeoffs

Local-first architecture also creates obligations:

- The app must handle local database corruption risks.
- The app must support migrations carefully.
- The app must eventually provide backup/export workflows.
- The app must define where local files live.
- Cross-device use is deferred.
- Collaboration is deferred.
- Cloud recovery is deferred.
- The user may be responsible for device-level backups until OLUSO provides built-in tooling.

### 8.3 Risks

| Risk | Severity | Mitigation |
|---|---:|---|
| User loses device or local database | High | Add backup/export plan before serious production use |
| Schema changes damage records | High | Use versioned migrations and migration tests |
| App writes partial or corrupt records | High | Use transactions and validation before commit |
| User expects sync across devices | Medium | State MVP boundary clearly |
| Attachments become broken file paths | Medium | Define attachment storage policy before attachment-heavy features |
| AI output is mistaken for verified record data | Medium | Require explicit user commit and provenance labeling |
| Local data contains sensitive facility information | Medium | Recommend OS-level protections and future encryption review |

---

## 9. Implementation Requirements

The implementation must satisfy the following requirements.

### 9.1 Persistence

- Use a durable local database or equivalent local structured store.
- Prefer SQLite unless a later ADR supersedes this decision.
- Keep persistence logic isolated from UI components.
- Use typed domain models where practical.
- Validate records before saving.
- Use transactions for multi-step writes.
- Avoid silent destructive operations.

### 9.2 Offline behavior

- The app must launch without internet access.
- Existing records must be readable offline.
- New records must be creatable offline.
- Existing records must be editable offline.
- Exports should not require internet access.

### 9.3 Error handling

- Failed saves must be visible to the user.
- The app must not pretend a record was saved if persistence failed.
- Validation errors must be surfaced near the relevant field or workflow step.
- Database connection or migration errors must block unsafe operation.
- Destructive actions must require confirmation.

### 9.4 Migrations

- Schema versions must be tracked.
- Migrations must be deterministic.
- Migrations must be tested against representative data.
- Failed migrations must not silently corrupt existing records.
- Development reset behavior must not be allowed as a production data strategy.

### 9.5 Backups and exports

- Data should be portable.
- Export formats should be planned before audit/report features are added.
- Backup location and restore behavior should be defined before real-world dependency.
- Generated exports should clearly identify date, source records, and export scope.

### 9.6 Security baseline

- Sensitive local data should not be casually written to logs.
- Debug dumps should not include full sensitive record contents by default.
- The app should use OS-appropriate user data locations.
- Future encryption requirements should be evaluated before broader use.

---

## 10. Data Ownership Rule

The user owns the OLUSO working data.

OLUSO must not trap critical records in opaque storage without export paths. The application may use structured local storage internally, but the user must eventually have practical ways to export, back up, and migrate their information.

This does not mean every internal table must be user-editable. It means the user cannot be locked out of their own HSE records by avoidable architectural choices.

---

## 11. Relationship to State Management

This ADR governs durable state.

The state-management document may define categories of state such as durable domain state, workflow state, form state, navigation state, cache state, and derived state. This ADR establishes that durable domain state must resolve to local persistence.

No frontend state library, cache, AI context window, generated report, or imported document replaces the local persistence layer.

---

## 12. Relationship to Scope Boundaries

This ADR supports OLUSO’s scope boundary by preventing premature platform expansion.

Local-first architecture is not only a technical choice. It is a product-control mechanism. It keeps the MVP focused on structured HSE work instead of account management, cloud infrastructure, team administration, sync conflict resolution, billing, or enterprise governance.

---

## 13. Relationship to Future Roadmap

Future roadmap items may include better export, reporting, backup, optional AI assistance, or limited integrations.

Those additions must not invalidate this ADR unless a later ADR explicitly changes the architecture.

Any future cloud feature must answer:

1. What user problem requires cloud behavior?
2. Why local-first is insufficient?
3. What data leaves the user’s machine?
4. Who owns the remote data?
5. How is access controlled?
6. How is data recovered if the service fails?
7. How are sync conflicts handled?
8. What compliance and security risks are introduced?
9. What maintenance burden is added?
10. What MVP value justifies the complexity?

Until those questions have strong answers, cloud behavior remains out of scope.

---

## 14. Reversal Conditions

This decision may be revisited only if one or more of the following become true:

- OLUSO has already proven the single-user local HSE backbone.
- A real multi-device workflow becomes unavoidable.
- Multiple users must collaborate on the same record set.
- A customer or deployment environment requires managed cloud storage.
- Backup and recovery needs cannot be reasonably satisfied locally.
- A later business model requires hosted infrastructure.
- Security review concludes that managed infrastructure is safer than local-only storage for a specific deployment context.

Even then, the correct next step is not automatic cloud adoption. The correct next step is a new ADR.

---

## 15. Verification Checklist

Before implementation proceeds past the persistence foundation, verify:

- [ ] The selected local database/storage option is documented.
- [ ] The app can launch offline.
- [ ] Durable records can be created offline.
- [ ] Durable records can be edited offline.
- [ ] Durable records survive app restart.
- [ ] Failed saves are visible to the user.
- [ ] Schema versioning exists.
- [ ] Initial migration strategy exists.
- [ ] Destructive operations are guarded.
- [ ] UI state is not treated as durable state.
- [ ] AI output cannot silently mutate records.
- [ ] Export/backup needs are captured for later implementation.
- [ ] Sensitive data is not written casually to logs.

---

## 16. Acceptance Criteria

This ADR is accepted when:

1. The project acknowledges OLUSO as local-first for MVP.
2. Local persistence is treated as the source of truth.
3. Cloud sync, accounts, SaaS hosting, and multi-user collaboration are explicitly out of scope for MVP.
4. SQLite or an equivalent local structured persistence layer is selected before implementation.
5. The state-management and build-plan documents remain consistent with this decision.
6. Future features are evaluated against local-first constraints before being added.

---

## 17. Final Decision Statement

OLUSO will begin as a local-first desktop HSE application.

The MVP will prioritize durable local records, offline usability, explicit user-controlled workflows, and maintainable structured persistence over cloud features, collaboration, automation, or enterprise platform behavior.

This decision is binding unless superseded by a later Architecture Decision Record.

