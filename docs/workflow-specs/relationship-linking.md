# Relationship Linking Workflow Specification

## Purpose

Describe how users link and unlink records across registers.  Linking relationships enables contextual navigation and ensures data integrity when associating entities such as hazards with processes or SEGs with hazards.

## Relationship Types

* **One‑to‑Many:** e.g. Processes belong to one Location; a Location has many Processes.
* **Many‑to‑Many:** e.g. SEGs may include many Hazards, and Hazards may belong to many SEGs.  Managed via a join table (`seg_hazards`).
* **Optional Links:** e.g. A Finding may reference a Chemical, Hazard, Process and Location, all optional.  Zero or more may be provided.

## Linking UI Patterns

* **Select Inputs:** For one‑to‑many relationships, use a select dropdown or searchable select.  When creating or editing a record, the user chooses the parent entity (e.g. selecting a Location for a new Process).  The UI loads available parents from the register and disables selection when no parents exist.
* **Multi‑Select Inputs:** For many‑to‑many relationships, use a multi‑select component that allows the user to search and select multiple items (e.g. selecting Hazards to add to a SEG).  Selected items appear as chips/tags with remove buttons.
* **Relationship Panel:** On detail pages, display linked records in the Relationship Panel (see `relationship-panel-specs.md`).  Each link includes the record’s label and status.  Links are interactive and navigate to the record’s detail page.
* **Link/Unlink Actions:** Next to the relationship list, include an “Add” button to link a new record and an “Unlink” button for each existing record.  Unlinking requires confirmation and does not delete either record—it simply removes the association.

## Business Rules

* A record cannot be linked to an archived or deleted entity.  The UI should filter out archived entities from selection lists.
* In many‑to‑many relationships, duplicates are prevented by a unique constraint on the join table (e.g. `UNIQUE(seg_id, hazard_id)`).
* When unlinking, ensure that removing the link does not violate domain rules (e.g. a SEG must contain at least one hazard; if only one hazard remains, prevent unlinking until another is added).

## Validation & Persistence

* The persistence module provides functions to create and delete relationships (e.g. `addHazardToSeg(segId, hazardId)`, `removeHazardFromSeg(segId, hazardId)`).
* These functions enforce foreign key constraints and validate that both entities exist and are active.
* For optional links on findings, the parent table must check that referenced entities exist or return an error.

## UI Feedback

* After linking or unlinking, update the Relationship Panel immediately to reflect changes.  Show a toast or inline notification confirming the action.
* If linking fails (e.g. due to validation rules), show an error banner with the reason.

## Acceptance Criteria

* Users can link records via select or multi‑select inputs when creating or editing records.
* Relationship panels display linked records and provide Add and Remove actions.
* The system prevents linking archived entities and prevents duplicate relationships.
* Unlinking requires confirmation and updates the UI without deleting the underlying records.