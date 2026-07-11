# 06 — Design Principles

## 1 Purpose

This document defines the **visual and interaction principles** that govern how OLUSO presents information.  It is **not** a restatement of the product philosophy; rather, it translates the product vision and information architecture into concrete expectations for look, feel and behavior.  OLUSO is a **local‑first desktop application** that exists to turn field conditions into structured, auditable safety intelligence.  The design principles here ensure the interface remains usable and compliant under real‑world conditions【turn2file0†L14-L18】.  They specify how the product’s identity—field‑usable, audit‑aware, relationship‑oriented and maintainable—should be reflected in its presentation【turn2file0†L115-L142】.

## 2 Design role in the documentation set

The documentation set for OLUSO contains the product vision, domain model, information architecture and workflow descriptions.  The product vision spells out the problem and the product’s core identity: local‑first desktop software, calm and structured, turning messy HSE data into durable records and intelligence【turn3file0†L171-L186】.  The domain model describes registers, records and their links【turn5file0†L111-L150】.  The information architecture defines the importance of registers, searchability and traceability【turn4file0†L38-L62】.  This design document sits on top of these, providing the **visual and interaction contract** that ensures the UI reinforces rather than undermines the underlying system.  It also lists anti‑patterns that would violate the product vision【turn2file0†L99-L113】.

## 3 Product personality

OLUSO should feel like a **professional operations console** for HSE work: calm, dense, traceable, fast, local and defensible.  It is not playful, not a consumer SaaS, not a Notion clone and not a spreadsheet with icons.  The product vision already calls for an experience that is **calm, structured and competent**, **dense but readable**, **fast to navigate** and closer to a disciplined operations console than a productivity toy【turn3file0†L171-L186】.  The interface should therefore project seriousness without inheriting the ugliness of legacy DOEHRS systems.  Use restrained color, clean typography and meaningful whitespace to achieve an industrial aesthetic that communicates trustworthiness.

## 4 Visual direction

### 4.1 Operational calm

HSE work is stressful; the interface should lower cognitive load.  Avoid gamification and decorative animation.  Use a restrained color palette, predictable layouts and subdued accents.  Risk and status indicators, not decorative elements, should draw the eye.  This aligns with the product vision’s warning against becoming a **vanity dashboard**【turn3file0†L217-L230】.

### 4.2 Density and scan‑ability

OLUSO cannot be too airy; inspectors and coordinators must quickly compare conditions, chemicals, SEG assignments and corrective actions.  Design tables and registers as primary surfaces.  Use row density, clear status indicators and consistent column logic.  Provide filters and search in context so users can narrow long lists.  Empty space should be intentional rather than decorative.  The information architecture makes registers the backbone of the system and demands that they be **searchable, maintainable, reviewable and auditable**【turn4file0†L38-L62】.

### 4.3 Register discipline

Registers should feel like **controlled ledgers**, not loose notes.  Each register (Chemical Inventory, Hazard Register, SEG Register, Permit Register, Corrective Action Register) must expose consistent columns: status, owner, review state, last updated, linked records and evidence indicators.  Records should appear durable.  Destructive deletion should be discouraged; archiving or changing status should be the norm.  The domain model distinguishes durable registers from time‑bound records【turn5file0†L111-L150】, and the UI must make this clear.

### 4.4 Traceability at a glance

OLUSO is built on relationships between records.  If a hazard links to a process, chemical, SEG, control, incident and corrective action, the UI must expose those links without forcing the user to navigate away.  Provide related‑record panels, backlinks, badges indicating source and “created from” references.  Make it easy to trace a corrective action back to its originating condition.  The workflow descriptions emphasise that links are not optional decoration and that users must be able to trace closed corrective actions back to their sources【turn6file0†L217-L230】.

### 4.5 Status over decoration

Status indicators are more important than visual polish.  The interface should make it immediately clear when a record is Draft, Active, Under Review, Inactive, Retired, Archived, Open, Completed, Verified, Closed, Overdue, Missing Evidence or Missing SDS.  The product materials repeatedly separate **completion from verification**, identifying weak verification as a key risk【turn2file0†L169-L175】【turn6file0†L232-L239】.  Use color coding and icons sparingly but consistently to communicate state.  Wherever possible, pair status with due dates and owners.

### 4.6 Forms for imperfect field reality

Field work is messy.  Avoid forms that require every value before saving.  Support draft states, allow unknown or not‑applicable values and distinguish between “missing,” “unknown,” “not applicable” and “not yet reviewed.”  Use required fields only for status promotion.  Records should mature over time rather than demand perfection at creation.  The workflow documentation states that the system should not require perfect data before useful work can begin【turn6file0†L159-L175】.

### 4.7 Compliance‑aware, not compliance‑theater

Compliance is not a binary switch.  The UI should support compliance by showing requirements, due dates, owners, evidence and review status, but it should not imply that a record is “compliant” simply because it exists.  Distinguish **legal requirements**, **company requirements**, **procedures**, **standards**, **best practices** and **professional judgment**【turn3file0†L138-L151】.  Avoid labels like “compliant/non‑compliant” unless backed by defined criteria.  Surface the source of each requirement so the user understands why a task exists.

### 4.8 Desktop‑first and local‑first

OLUSO is a **desktop‑first application**.  Do not design like a mobile inspection app or a cloud SaaS admin panel.  Keyboard navigation, persistent sidebars, split panes and table layouts are important.  Local saving and offline confidence matter; avoid patterns that depend on constant network connectivity.  Provide export and report affordances so users can generate offline artifacts.  The product vision and information architecture anchor OLUSO as local‑first and desktop‑oriented【turn2file0†L14-L18】【turn4file0†L124-L137】.

## 5 Interaction principles

1. **Calm, predictable navigation** – Use a consistent hierarchy of global navigation (home, registers, dashboards), contextual navigation (tabs and subtabs) and local navigation (drawer panels).  Avoid abrupt page transitions and nested modals.
2. **Direct manipulation** – Users should be able to interact directly with lists (sorting, filtering, selecting) and records (editing inline where safe, opening detail panels).  Avoid hidden actions behind hover or multi‑step menus.
3. **Progressive disclosure** – Show essential information up front and hide advanced options behind toggle controls.  Do not overwhelm the user with forms and fields until they are needed.
4. **Local‑first interactions** – Save user input immediately to local storage, with clear indicators of sync status.  Provide offline warnings when necessary but never block the user from continuing work.
5. **Audit‑trail visibility** – All changes should be logged and visible to authorized users.  Provide history views and activity feeds for each record to support verification and review.

## 6 Status, risk and verification design

Design patterns should clearly differentiate between incomplete work, completed work and verified work.  Use badges, icons and progress bars to distinguish the phases.  Provide summary indicators at the register level showing counts of overdue items, missing evidence and unverified tasks.  Surface risk severity and likelihood in hazard and incident registers.  Use consistent scales (e.g. low/medium/high, numeric ratings) and visual elements to convey risk.

## 7 Navigation and layout

Use a **primary sidebar** for top‑level sections (e.g. Dashboard, Registers, Reports, Settings).  Under Registers, provide sub‑links to each register.  Use a **split‑pane layout** for registers: a list on the left with filters and search, and a detail or edit view on the right.  Allow the user to resize panes and collapse the sidebar.  Avoid nested navigation levels beyond two.  Provide a global search that can find any record by name, ID or tag.

## 8 Form design principles

- **Progressive completeness**: Forms should accept incomplete entries; only enforce field completion when a record is promoted to Active or Verified.
- **Contextual guidance**: Provide inline helper text and reference links to procedures or standards.  Where appropriate, embed checklists or SOPs so users know what information is expected.
- **Evidence capture**: When evidence (photos, SDS, permits) is required, allow the user to attach files or link existing records.  Show missing evidence as an explicit status.
- **Validation and defaults**: Offer sensible defaults (e.g. current date) and validate inputs against regulatory ranges or domain constraints where possible.  Warn, but do not block, for values that deviate from expectations; allow justification fields.

## 9 Compliance and audit readiness

OLUSO must generate artifacts that are defensible in audits.  Design the UI to support preparation and export of hazard assessments, exposure assessments, chemical inventories and corrective action logs.  Make it easy to download or print registers with full audit trails and evidence attachments.  Ensure that all statuses, owners and timestamps are visible on exported reports.  Provide filters for “records that need review” and “records missing evidence” to support self‑audits.  This supports the product vision’s goal of turning data into **structured, searchable, auditable safety intelligence**【turn3file0†L16-L22】.

## 10 Local‑first desktop design

Because OLUSO runs locally, design patterns should build confidence in offline operation.  Show sync status and last‑sync times.  Provide a manual “sync now” action.  Avoid UI designs that feel like a web app (loading spinners, network error screens).  Use local caching to enable immediate feedback.  The product brief emphasises that OLUSO is not a cloud SaaS but a local application【turn2file0†L14-L18】.

## 11 Anti‑patterns

The following patterns violate the product vision and design principles:

- **Notion clone** – Avoid generic page‑building paradigms where users must assemble their own registers.  OLUSO provides controlled registers; it is not a freeform wiki.
- **Vanity dashboards** – Do not prioritise large graph canvases or aesthetic charts that hide underlying data.  Dashboards should be minimal summaries that link to registers.
- **Spreadsheet wrapper** – Do not simply expose a table grid and call it a register; registers have structure, status and linked relationships.
- **Compliance portal** – Avoid portal‑style layouts with certificate counters and checkboxes that pretend to guarantee compliance.  Real compliance requires traceability and evidence.
- **Mobile inspection app** – Do not design for one‑handed use or rely on gestures.  OLUSO is keyboard and mouse oriented.
- **AI‑first app** – Do not design generative AI as the primary interface.  Agent assistance should supplement, not replace, user control.

## 12 Design decision filter

When evaluating design decisions, ask:

1. **Does this support the objective?**  Does it help users create, link and verify HSE records and reduce risk?
2. **Does it meet worker needs?**  Will a field inspector, coordinator or auditor understand and use it?
3. **Does it address failure modes?**  How will the UI behave with missing data, partial connectivity or outdated files?
4. **Is it maintainable?**  Can the component be extended or audited by another engineer?
5. **Is it safe?**  Does it avoid encouraging risky shortcuts or hiding risk severity?
6. **Is it compliant?**  Does it make legal requirements explicit and traceable?
7. **Can it be verified?**  Are there clear criteria for completion, review and verification?

A design that fails any of these should be revised.

## 13 MVP design standard

Even for an early release, OLUSO must meet a baseline standard:

- All core registers (SEG, Hazard, Chemical, Permit, Corrective Action) exist and are navigable.
- Each record has fields for status, owner, last updated, due date and linked records.
- Records can be created in a draft state and later promoted.
- Related records are visible from each record detail.
- The application uses a calm, restrained color palette and predictable layouts.
- The interface supports offline work and shows sync status.
- Reports and registers can be exported with full audit trails.

These minimum standards ensure the product upholds its vision from the start.

## 14 Conclusion

These design principles translate the OLUSO product vision and information architecture into actionable guidance.  They prioritise operational calm, density, traceability, status clarity and local‑first design.  By following these rules and avoiding the anti‑patterns, the OLUSO team can build an HSE system that supports real‑world work and stands up to audit scrutiny.
