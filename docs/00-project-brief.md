# 00 — Project Brief

# OLUSO Product Brief

## 1. Product Name

**OLUSO**

## 2. Product Type

OLUSO is a local-first desktop application for managing health, safety, environmental, and industrial hygiene information in a structured, field-usable way.

The product is not intended to be a generic note-taking app, spreadsheet replacement, or enterprise EHS suite. It is a focused operational tool for maintaining registers, records, observations, corrective actions, and compliance-supporting information in one coherent system.

## 3. Product Summary

OLUSO helps an HSE professional organize the operational reality of a facility:

* What chemicals are present
* Where work occurs
* What processes exist
* Which worker groups may be exposed
* What hazards have been identified
* What controls are in place
* What field observations, inspections, audits, and air sampling activities have occurred
* What incidents or near misses need follow-up
* What corrective actions remain open
* What compliance items require tracking

The application’s purpose is to reduce fragmented HSE work by replacing scattered notes, spreadsheets, folders, and memory-based tracking with a structured local system.

## 4. Core Problem

HSE work breaks down when critical information lives in disconnected places.

Typical failure modes include:

* Chemical inventories becoming stale
* SDS files not being linked to actual chemicals or processes
* Hazards being documented without controls or verification
* Observations creating no corrective action trail
* Incidents being investigated without durable linkage to hazards, processes, or controls
* Compliance tasks depending on memory instead of a visible calendar or register
* Field information being difficult to retrieve during audits, walkthroughs, or planning

OLUSO exists to make HSE information easier to capture, connect, review, and act on.

## 5. Primary User

The primary user is an HSE professional responsible for practical field execution and documentation.

This includes users who need to:

* Walk a facility and document observations
* Track hazards and corrective actions
* Maintain chemical and SDS information
* Connect processes, locations, equipment, and SEGs
* Support audit readiness
* Prepare for inspections, exposure assessments, and incident reviews
* Keep operational safety information organized without relying on an enterprise system

The initial product assumes a single-user workflow.

## 6. Product Thesis

A useful HSE application should behave more like an operational register system than a document dump.

The app should make important relationships explicit:

* Chemicals connect to SDS records, exposure limits, processes, and locations
* Processes connect to locations, equipment, hazards, and SEGs
* Hazards connect to controls, observations, incidents, and corrective actions
* Corrective actions connect to verification evidence
* Compliance items connect to records, documents, and due dates

The product should support field thinking first, then documentation.

## 7. Initial Scope

The initial scope is a structured desktop app with core navigation areas for:

* Dashboard
* Operations
* Chemical Safety
* Risk Management
* Field Work
* Incidents
* Corrective Actions
* Compliance
* Reports

The first build should prioritize clean navigation, durable data structures, and simple register-based workflows before advanced reporting, automation, or external integrations.

## 8. Initial Non-Goals

OLUSO should not initially attempt to be:

* A full enterprise EHS management system
* A multi-tenant SaaS platform
* A regulatory interpretation engine
* A replacement for legal review or professional judgment
* A real-time monitoring system
* A complex workflow automation platform
* A mobile-first inspection app
* A document management system with unlimited file handling
* An AI-first application

AI assistance, advanced analytics, cloud sync, mobile capture, and multi-user workflows may be considered later, but they are not part of the first product definition.

## 9. Product Principles

OLUSO should be:

### Local-first

The user should be able to work without depending on cloud availability.

### Register-driven

The app should treat key HSE entities as structured records, not loose notes.

### Field-usable

Screens should support real work: quick review, clean entry, obvious status, and minimal friction.

### Audit-aware

Records should preserve enough context to support review, investigation, and follow-up.

### Relationship-oriented

Important operational links should be visible and intentional.

### Maintainable

The application should avoid overbuilt abstractions before the domain model is stable.

## 10. Success Criteria

The product brief is satisfied when the application can eventually support the following outcomes:

* A user can see the major HSE operating areas from the side navigation.
* A user can maintain structured registers for chemicals, processes, locations, SEGs, hazards, controls, incidents, and actions.
* A user can connect related records without duplicating information across unrelated pages.
* A user can identify open safety work quickly.
* A user can retrieve supporting information during an audit, walkthrough, or planning session.
* The application structure remains understandable as more modules are added.
* The product remains usable as a local desktop application without requiring cloud infrastructure.

## 11. Key Risks

### Scope Creep

HSE systems can expand endlessly. The first version must stay focused on registers, relationships, and basic workflows.

### Data Model Drift

If entities are not clearly defined early, the app will become a collection of unrelated pages.

### Over-Documentation

The product should help create useful records, not bury the user in administrative burden.

### Weak Verification

Corrective actions and controls lose value if the app does not distinguish between assigned, completed, and verified work.

### Compliance Ambiguity

The app may support compliance readiness, but it must not imply that storing a record equals legal compliance.

## 12. Current Product Position

OLUSO is in the documentation and architecture definition stage.

The immediate goal is to define the product clearly enough that future documents can describe:

* Product vision
* Information architecture
* Sidebar navigation
* Domain model
* User workflows
* Design principles
* Build plan
* Scope boundaries
* Routing
* UI architecture
* State management
* Future roadmap
* Architecture decision records

This brief is the anchor document. Later documents should expand specific decisions without changing the basic product purpose.
