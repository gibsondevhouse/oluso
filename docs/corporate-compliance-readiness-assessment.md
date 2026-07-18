# OLUSO Corporate Compliance and Security Readiness Assessment

**Assessment date:** July 16, 2026  
**Target:** OLUSO v0.1.0 local-first desktop application  
**Purpose:** Preliminary assessment for submitting OLUSO to a corporate IT, information-security, privacy, legal, accessibility, and HSE review process.

> This is a technical and product-readiness assessment, not legal advice, an audit, or a certification. The company's own policies, industry, jurisdictions, intended data, and deployment model determine the final requirements.

## Executive conclusion

OLUSO would most likely **not need a formal certification merely to be considered for installation on a company-managed workstation**. The normal first gate is an internal application-security and software-risk review: architecture and data-flow documentation, data classification, vulnerability and dependency scans, a software bill of materials (SBOM), a signed installer, least-privilege behavior, a patch/support plan, privacy review, and proof of testing.

The current application is a credible foundation for a **restricted, single-user internal pilot using non-sensitive or synthetic data**, but it is **not ready to be the authoritative corporate HSE system of record**. The main blockers are:

1. no authentication, authorization, SSO, or role-based access control;
2. no actor-attributed, append-only audit trail or record version history;
3. no application-level encryption for the SQLite database or JSON backups;
4. no data-retention, legal-hold, access-request, or controlled-disposal policy;
5. Content Security Policy is disabled and the default URL/file opener capability is enabled;
6. no documented signed-build, trusted-update, vulnerability-management, SBOM, or release-provenance process;
7. no formal threat model, security test plan, penetration test, privacy assessment, or production support/incident-response package.

The most likely enterprise security targets are **NIST CSF 2.0** for risk governance, **NIST SSDF** for the development lifecycle, an adapted **OWASP ASVS** control baseline for the webview, and the company's endpoint, privacy, records-management, and accessibility policies. **SOC 2 Type II** or **ISO/IEC 27001** would become much more relevant if OLUSO were offered as a hosted service, externally supplied product, or supported vendor platform. Neither is a certification that can be assigned to this source tree by itself.

## Approval outlook by intended use

| Intended use | Current outlook | Reason |
|---|---|---|
| Personal evaluation with synthetic data on a test device | **Reasonable after ordinary IT approval** | Local architecture, limited native capability set, no cloud dependency, and a good automated-test baseline reduce initial exposure. |
| Single named HSE user on a managed corporate endpoint | **Conditional pilot only** | Requires a signed package, security review, explicit data classification, approved endpoint encryption/backup controls, vulnerability scans, and a named support owner. |
| Department-wide or shared use | **Not ready** | No identity, SSO, RBAC, user provisioning, actor attribution, or shared-data concurrency model. |
| Official HSE, incident, exposure, or regulatory system of record | **Not ready** | Audit history, retention, legal hold, confidentiality, integrity controls, access controls, and validated recordkeeping behavior are insufficient. |
| External commercial product or hosted service | **Not ready** | Would require a full secure-development and vendor-assurance program; customers may then request SOC 2 Type II and/or ISO/IEC 27001 evidence. |

## What “compliance” means here

There are three separate questions that should not be collapsed into one:

1. **Corporate technology approval:** Is the application safe, supportable, licensable, patchable, and compatible with managed endpoints?
2. **Regulated-record suitability:** Can it preserve the confidentiality, integrity, availability, traceability, retention, and authorized access required for the records placed in it?
3. **Organizational assurance:** Does the developer/vendor operate a controlled security program that has been independently examined or certified?

A product can help users manage compliance records without itself being “certified compliant.” OLUSO already states the right boundary in [Scope Boundaries](08-scope-boundaries.md): it supports compliance readiness but does not determine legal applicability or certify legal compliance.

The [AICPA describes SOC](https://www.aicpa-cima.com/soc) as CPA assurance services over controls of a service organization, while [ISO/IEC 27001](https://www.iso.org/standard/27001) defines requirements for an organization's information-security management system. These are organization/service assurance mechanisms, not feature badges that a desktop binary earns by implementing a checklist.

## Most likely corporate requirements

### 1. Application-security and secure-development baseline

The most defensible baseline is:

- [NIST Cybersecurity Framework 2.0](https://www.nist.gov/cyberframework) for governing and communicating cyber risk;
- [NIST SP 800-218 Secure Software Development Framework](https://csrc.nist.gov/pubs/sp/800/218/final) for secure-development practices used by both software producers and acquirers;
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/) as a testable control catalog for the Svelte/webview layer, adapted for a local Tauri desktop threat model;
- company-specific secure coding, code-review, secrets, change-management, vulnerability-remediation, and release requirements.

Expected evidence normally includes a threat model, security requirements, review records, automated security checks, dependency inventory, vulnerability triage, release approvals, and a vulnerability disclosure/support process.

### 2. Software supply chain and endpoint deployment

Corporate IT will commonly expect:

- a complete SBOM for npm and Rust dependencies in CycloneDX or SPDX format;
- license inventory and third-party notices;
- reproducible or controlled builds with release checksums and provenance;
- Windows code signing and/or macOS signing and notarization;
- a tested, authenticated patch/update process;
- installation without local administrator privileges where feasible;
- compatibility with endpoint protection, EDR, application allowlisting, proxy/firewall rules, and centralized software distribution;
- a defined support period and vulnerability-remediation service level.

[CISA's SBOM resources](https://www.cisa.gov/topics/cyber-threats-and-advisories/sbom/sbomresourceslibrary) explain the software-supply-chain transparency role of an SBOM. Tauri's own [distribution guidance](https://v2.tauri.app/distribute/) states that signing validates the identity of the application provider and is required on most platforms.

### 3. Identity, access, and auditability

For anything beyond a private single-user pilot, expect requirements for:

- company identity integration, usually OIDC/SAML through the corporate identity provider;
- MFA inherited from the identity provider;
- role-based or attribute-based access control and least privilege;
- joiner/mover/leaver provisioning and immediate deprovisioning;
- unique user identity for every action;
- append-only audit events recording who did what, when, to which record, and the before/after state;
- protected logs, clock integrity, review/export tools, and a defined audit-log retention period.

Relying on the operating-system login may be acceptable for a strictly single-user local tool, but that exception must be explicitly approved. It is not adequate for shared devices, shared databases, or records requiring user-level accountability.

### 4. Data protection, privacy, and records management

OLUSO may contain employee names, incident narratives, exposure results, location details, chemical information, evidence references, and sensitive facility information. Corporate reviewers will likely require:

- a data inventory and classification;
- a documented processing purpose and minimum necessary data fields;
- encryption at rest and in backups, with managed key handling;
- access, correction, export, deletion, retention, and legal-hold procedures;
- secure backup, recovery, and tested restore procedures with stated RPO/RTO;
- secure disposal of databases, backups, logs, and temporary data;
- a privacy impact assessment when personal or sensitive information is in scope;
- documented data locations, network flows, subprocessors, and cross-border transfers if any remote services are later introduced.

If EU personal data is in scope, GDPR principles such as purpose limitation, data minimization, accuracy, storage limitation, integrity, and confidentiality apply; see the [European Commission's GDPR principles](https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/principles-gdpr_en). California and other state privacy laws may also apply depending on the organization and data; the [California Attorney General's CCPA overview](https://oag.ca.gov/privacy/ccpa) summarizes relevant access, deletion, correction, and sensitive-information rights.

### 5. HSE and regulated-record requirements

The applicable rules depend on what OLUSO is declared to be the official repository for.

- **OSHA injury/illness records:** official OSHA 300/301 records have a five-year retention requirement under [29 CFR 1904.33](https://www.osha.gov/laws-regs/regulations/standardnumber/1904/1904.33), including updating the stored OSHA 300 log when required.
- **Employee exposure and medical records:** if OLUSO stores records within the scope of [29 CFR 1910.1020](https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1020), exposure records generally require at least 30 years of retention, medical records generally require employment plus 30 years, and employees/designated representatives have access rights. Medical information also carries heightened confidentiality obligations.
- **ISO 45001:** OLUSO can support an organization's occupational-health-and-safety management system, but [ISO 45001](https://www.iso.org/standard/63787.html) certifies an organization's management system—not an HSE app. OLUSO should map features and evidence to customer processes without claiming product certification.
- **ISO 14001 / environmental requirements:** applicable when the customer uses OLUSO as evidence within an environmental management system. Legal registers, waste, emissions, permits, and inspections still need jurisdiction-specific review.
- **HIPAA:** not automatically applicable merely because an employer stores safety or occupational-health information. [HHS states](https://www.hhs.gov/hipaa/for-professionals/covered-entities/index.html) that HIPAA applies to covered entities and business associates; ordinary employers are not covered solely in their employer role. Applicability must be assessed if a covered health plan/provider or its business associate uses OLUSO for PHI.
- **FDA 21 CFR Part 11:** potentially applicable only if OLUSO is used for electronic records or signatures required by FDA predicate rules. [FDA's scope guidance](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/part-11-electronic-records-electronic-signatures-scope-and-application) explains this predicate-rule connection and the need for controls such as authorized access and reliable records. That use would need validation, controlled access, audit trails, record protection, and electronic-signature controls not present today.

The safest initial corporate scope is to state that OLUSO is a **compliance-supporting operational register, not the official OSHA log, employee medical-record repository, legal-regulatory interpretation engine, or electronic-signature system**.

### 6. Accessibility

Many corporate procurement programs require accessibility even when public-sector rules do not directly apply. Target [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22/) for the rendered application and provide an accessibility conformance report or equivalent evidence. OLUSO has an existing [accessibility checklist](test-specs/accessibility-checklist.md), but it currently references WCAG 2.1 AA and should be updated and verified with automated and manual testing.

## Current OLUSO posture

### Positive controls already present

- The [project brief](00-project-brief.md) and [local-first ADR](adr/ADR-0001-local-first.md) define a single-user, offline, local system of record and explicitly avoid premature cloud, account, and multi-tenant scope.
- Native persistence uses SQLite in the platform application-data directory; it enables foreign keys and WAL mode and uses transactional create, update, archive, restore, reset, migration, and import operations in [native persistence](../src-tauri/src/persistence.rs).
- Schema migrations and a migration log exist, and failed writes/restores are tested for rollback.
- Records have stable identifiers, created/updated timestamps, archive state, archive time/reason, validation, and relationship checks.
- Backup/import/restore behavior validates the database shape and warns before replacement. Archive/restore is preferred over destructive record deletion in normal workflows.
- The Tauri capability list is relatively narrow: `core:default` and `opener:default` in [default capabilities](../src-tauri/capabilities/default.json). No cloud sync or application-data API is configured.
- The current automated quality baseline passed on July 16, 2026: Svelte diagnostics reported 0 errors and 0 warnings; 146 frontend tests passed; 7 Rust persistence tests passed.
- `npm audit` found no critical, high, or moderate vulnerabilities. It did report three low-severity findings through an older `cookie` dependency in SvelteKit, which should still be remediated before submission.

### Material gaps

| Control area | Current state | Assessment |
|---|---|---|
| Authentication and authorization | Explicitly out of MVP scope; no login, SSO, MFA, roles, or user lifecycle | **Blocking for shared or authoritative use** |
| Audit trail and record history | Current-state timestamps and archive metadata exist; no actor, immutable event journal, or before/after history | **Blocking for system-of-record use** |
| Database encryption | Standard bundled SQLite; no SQLCipher or application-managed encryption | **Gap** |
| Backup confidentiality and integrity | Complete database is downloaded as readable JSON by [backup code](../src/lib/data/backup.ts); no encryption, signature, MAC, or retention control | **Gap** |
| Webview security | `"csp": null` in [Tauri configuration](../src-tauri/tauri.conf.json) | **High-priority hardening gap** |
| Native capabilities | `opener:default` is enabled; actual need and scope should be reviewed | **Review and minimize** |
| Destructive administration | Settings can replace or clear the entire data set; no admin role, audit event, legal hold, dual control, or recovery checkpoint | **Blocking for authoritative records** |
| Secure SDLC evidence | Functional tests exist, but no formal threat model, security requirements, SAST/secret scanning, security-test suite, or penetration-test report was found | **Gap** |
| Dependency assurance | npm audit is available; Rust `cargo-audit` was not installed, and no continuous dependency policy was found | **Gap** |
| SBOM and license evidence | No generated SBOM, third-party notice, dependency-license report, or root license text was found; `package.json` declares MIT but that is not a complete distribution package | **Gap** |
| Release security | No documented code-signing, notarization, trusted updater, checksums, provenance, or release approval flow was found | **Blocking for normal corporate distribution** |
| CI/change control | No repository CI configuration or protected review/release evidence was found in this workspace | **Gap** |
| Retention and legal hold | No implemented schedule by record type, hold mechanism, disposition approval, or access-request workflow | **Blocking for regulated records** |
| Privacy governance | No data inventory, privacy notice, DPIA/PIA, controller/processor roles, or privacy-rights procedure was found | **Gap when personal data is used** |
| Recovery/continuity | Manual snapshot restore is present, but no encrypted scheduled backup, recovery objective, disaster-recovery runbook, or restore drill evidence | **Partial** |
| Accessibility | Design checklist exists; no current WCAG 2.2 AA conformance report or complete automated/manual evidence was found | **Partial/planned** |
| Support and incident response | No production owner, vulnerability reporting channel, patch SLA, incident plan, lifecycle, or end-of-support policy was found | **Gap** |

Tauri documents that CSP only protects a webview when it is configured and recommends making it as restrictive as possible; see [Tauri CSP guidance](https://v2.tauri.app/security/csp/). This makes the current `csp: null` configuration a concrete pre-submission issue, not merely a paperwork item.

## Recommended remediation plan

### P0 — before submitting a pilot package

1. **Freeze the intended-use statement.** Define single user, managed device, local-only data, supported operating systems, and prohibited data. Initially prohibit employee medical records, direct identifiers in exposure data, official OSHA logs, and regulated electronic signatures unless separately approved.
2. **Create a data-flow and threat model.** Document storage paths, localStorage-to-SQLite migration, imports/exports, opener behavior, trust boundaries, abuse cases, and recovery paths.
3. **Harden Tauri.** Add a restrictive CSP, remove or tightly scope `opener:default` if unnecessary, confirm no remote scripts/content, and document every native permission.
4. **Build a secure release pipeline.** Run checks/tests, SAST, secret scanning, npm and Rust advisory scans, license checks, SBOM generation, artifact hashing, and malware scanning. Fail releases on defined severity thresholds.
5. **Sign the application.** Produce company-verifiable Windows-signed and/or macOS-signed/notarized installers through a controlled build identity.
6. **Remediate dependency findings.** Upgrade the SvelteKit dependency path that currently produces the three low npm findings; add `cargo-audit` or `cargo-deny` and establish triage evidence.
7. **Protect local data and backups.** Either implement application encryption with managed keys or obtain written approval to rely on company full-disk encryption and per-user filesystem controls. Encrypt and integrity-protect portable backups in all cases.
8. **Write the operational package.** Include architecture, installation/uninstallation, network behavior, data classification, support contact, patch SLA, incident reporting, backup/recovery, known limitations, license notices, SBOM, test results, and security-scan results.
9. **Run accessibility checks.** Update the target to WCAG 2.2 AA, run automated tests, keyboard and zoom testing, and at least NVDA or VoiceOver review on critical workflows.

### P1 — before real company HSE data or department deployment

1. Add approved identity integration or a formally approved OS-identity binding.
2. Add roles/permissions, default deny, joiner/mover/leaver controls, and privileged-operation protection.
3. Add an append-only audit event model with actor, action, object, timestamp, reason, correlation ID, and before/after evidence; prevent ordinary users from modifying audit history.
4. Add record versioning and defensible correction behavior rather than silent replacement.
5. Implement record-class retention schedules, legal hold, authorized disposition, access/export, and deletion evidence.
6. Protect backup confidentiality and authenticity; add scheduled backups, recovery objectives, and witnessed restore tests.
7. Commission an independent penetration test and resolve findings under a documented risk-acceptance process.
8. Complete privacy and legal reviews for employee, incident, and exposure information.
9. Establish support, incident response, vulnerability disclosure, release cadence, and end-of-life procedures.

### P2 — before making compliance or vendor-assurance claims

1. Map OLUSO features and evidence to the customer's ISO 45001/ISO 14001 processes without claiming that the software is certified.
2. If OLUSO becomes a hosted/vendor service, establish an organization-wide information-security management system and decide whether customers require ISO/IEC 27001 certification and/or a SOC 2 Type II examination.
3. Validate any use subject to FDA electronic-record rules or other industry-specific requirements with qualified legal/quality owners.
4. Maintain a customer-facing security package or trust center containing current, independently supported claims.

## Vitre comparison

### What Vitre publicly demonstrates

Vitre's public material demonstrates **EHS/quality operational compliance support**, not a blanket product compliance certification:

- Its [main product site](https://vitre.io/) promotes inspections, issue tracking, training/certification tracking, equipment oversight, actions, dashboards, and audit-readiness evidence.
- Its official support documentation shows [OIDC SSO integration](https://support.vitre.io/hc/en-us/articles/31606674318865-Setting-Up-OIDC-Single-Sign-On-SSO-with-Vitre), tenant-specific identity-provider configuration, and regular-user/admin permission assignment.
- The [employee/user synchronization guide](https://support.vitre.io/hc/en-us/articles/20476891755665-Synchronization-of-Employees-and-Users) describes API synchronization, SSO/OTP/password authentication options, user deactivation by end date, and internal/external users.
- The [employee details guide](https://support.vitre.io/hc/en-us/articles/12511877373585-Viewing-Employee-Details) documents permissions and an Actions Log containing system-change history.
- Vitre's [privacy policy](https://vitre.io/privacy-policy/) says it uses GDPR controls as a worldwide baseline, supports access/correction/deletion/portability rights, uses DPA-compliant vendors, may transfer data internationally, may retain conversation and personal data for up to six years, and disposes of account data within 60 days after deletion. These are vendor statements, not an independent certification.

### What was not publicly verified

As of July 16, 2026, this review did **not locate public, authoritative evidence** that Vitre holds any of the following:

- SOC 2 Type I or Type II report;
- ISO/IEC 27001 certificate;
- ISO 45001 or ISO 14001 certification covering the software/vendor;
- HIPAA attestation or business-associate commitment;
- FedRAMP authorization;
- public penetration-test report or security whitepaper.

That is not proof that Vitre lacks private reports, certifications, enterprise contract controls, or customer-specific hosting arrangements. Such evidence is often supplied under NDA. A proper vendor comparison should request:

1. current SOC 2 report and bridge letter, or the ISO/IEC 27001 certificate and statement of applicability;
2. penetration-test executive summary and open-finding status;
3. security architecture, encryption details, tenant-isolation model, logging, backup, RPO/RTO, and incident-notification terms;
4. DPA, subprocessors, data-residency options, transfer mechanism, deletion verification, and retention configuration;
5. SSO enforcement, MFA, SCIM/provisioning, role model, audit-log coverage, API-key controls, and privileged-access management;
6. SBOM/vulnerability-management practices, secure-development lifecycle, patch SLAs, and business-continuity evidence.

### Practical comparison

| Area | Vitre public position | OLUSO current position |
|---|---|---|
| Deployment | Multi-user web/mobile SaaS platform | Single-user local desktop application |
| Compliance function | Broad safety, quality, training, equipment, forms, actions, and audit-readiness workflows | Structured HSE registers, relationships, corrective actions, review support, and export |
| Identity | Public OIDC SSO, OTP/password options, user/admin concepts | None |
| Authorization | Public permission-aware views and admin distinctions | None |
| Audit history | Publicly documented action/system-change history on at least employee records | Timestamps and archive metadata only; no actor/event journal |
| Privacy | Public self-described GDPR baseline and data-subject rights process | No implemented/documented privacy governance package |
| Security attestations | No public SOC 2 or ISO/IEC 27001 evidence located | None; also not yet operating as a service organization |
| Data control tradeoff | Enterprise collaboration but vendor hosting, transfer, and subprocessor risk must be reviewed | Local control and offline use, but endpoint loss, unencrypted database/backups, and single-device recovery risk |

The fair conclusion is: **Vitre publicly appears substantially more mature in enterprise identity, permissions, audit history, integrations, and privacy operations. Its public website establishes compliance-support functionality and claimed GDPR alignment, but it does not establish a publicly verified SOC 2 or ISO/IEC 27001 assurance level.**

## Suggested corporate submission package

Prepare one review folder containing:

1. product and intended-use statement;
2. architecture and data-flow diagram;
3. data classification and prohibited-data statement;
4. threat model and security-control matrix;
5. privacy impact assessment;
6. SBOM, dependency-license report, and third-party notices;
7. vulnerability scan, SAST, secret scan, Rust/npm advisory scan, and penetration-test results;
8. automated and manual test evidence, including accessibility;
9. signed installer, hashes, build provenance, install/uninstall instructions, privileges, and network indicators;
10. backup/recovery and retention design;
11. support owner, incident contact, patch SLA, release policy, vulnerability disclosure, and end-of-life policy;
12. known limitations and explicit statement that OLUSO does not make legal-compliance determinations.

## Final recommendation

Submit OLUSO first as a **local, single-user, non-authoritative HSE productivity pilot**. Do not initially position it as “SOC 2 compliant,” “ISO 27001 compliant,” “ISO 45001 certified,” “OSHA compliant,” or equivalent. Instead, state that it is designed to support controlled HSE recordkeeping and that corporate security, privacy, records, accessibility, and HSE owners will approve the permitted data and use.

Before even that limited submission, complete the P0 work: signed distribution, CSP/capability hardening, threat model, SBOM and license evidence, complete dependency scans, encrypted portable backups, explicit endpoint-encryption reliance, privacy/data scope, accessibility verification, and a support/patch package. Identity, immutable auditing, retention/legal hold, and independent security testing should be treated as release blockers before OLUSO becomes a shared or authoritative corporate record system.

## Assessment limitations

- This was a source-and-document review, not a penetration test, privacy audit, legal analysis, or certification examination.
- Public Vitre materials were reviewed; private contracts, trust-center documents, or NDA materials were not available.
- The assessment did not receive the target company's security policies, jurisdiction list, regulated-industry profile, identity architecture, endpoint baseline, or formal data classification.
- Rust dependency vulnerability status remains incomplete because `cargo-audit` was not installed in the workspace at assessment time.
