# ADAMA HSE — Global Enterprise, Location, and Functional Assignment Campaign

**Repository:** `gibsondevhouse/oluso`  
**Campaign objective:** Correct the enterprise and location data model so ADAMA can be represented globally, while allowing one physical Location to support several operational functions such as tolling, laboratory work, packaging, warehousing, manufacturing, distribution, maintenance, and administration.

---

# 1. Governing Decision

The application must not force a Location to have one exclusive operational purpose.

A physical Location may support several functions at the same time.

```text
Tifton Site
├── Manufacturing
├── Tolling
├── Packaging
├── Warehousing
├── Laboratory
├── Maintenance
├── Utilities
└── Administration
```

A single Building or Unit may also support several functions:

```text
Building 3
├── Packaging
├── Finished-Goods Warehousing
├── Quality Laboratory
└── Maintenance Support
```

Therefore, operational function must not be encoded as the Location node type.

The model must separate:

```text
Organization hierarchy
+
Geographic hierarchy
+
Physical Location hierarchy
+
Operational Function assignments
```

These structures must be connected, but they must not be collapsed into one record type.

---

# 2. Primary Modeling Principles

## 2.1 Organization is not Location

ADAMA Corporate, regional entities, legal entities, country organizations, and site organizations are Organizations.

They are not physical Locations.

```text
ADAMA Global                         [Organization]
└── ADAMA North America              [Organization]
    └── ADAMA United States          [Organization]
        ├── Tifton Operations        [Organization]
        └── Ocilla Operations        [Organization]
```

## 2.2 Geography is not ownership

Countries, states, counties, and cities are geographic Locations.

ADAMA does not own a Country, State, or City merely because it operates there.

```text
United States                        [Country]
└── Georgia                          [StateOrProvince]
    └── Tift County                  [CountyOrDistrict]
        └── Tifton                   [CityOrMunicipality]
```

## 2.3 Physical structure is separate from operational function

A Site, Facility, Building, Unit, Zone, Room, or Storage Area describes where something physically exists.

Operational Function describes what happens there.

```text
Physical Location:
Tifton Campus
└── Building 3
    └── Unit 7

Operational Functions:
- Manufacturing
- Tolling
- Packaging
- Laboratory Support
```

## 2.4 A Location may have several Functions

The relationship is many-to-many:

```text
One Location
→ many Location Function Assignments

One Operational Function
→ many Locations
```

## 2.5 Processes remain distinct from Functions

A Function is a broad capability or purpose.

A Process is a repeatable operational workflow.

```text
Function:
Packaging

Processes:
- Fill finished product bags
- Seal bags
- Palletize finished goods
- Apply labels
- Move pallets to warehouse
```

## 2.6 Tasks remain distinct from Processes

A Task is a discrete activity within a Process.

```text
Process:
Package WDG product

Tasks:
- Position empty bag
- Start filler
- Monitor bag weight
- Seal bag
- Transfer bag to pallet
- Clear packaging blockage
- Clean packaging equipment
```

## 2.7 Operating condition is scenario-specific

Routine, maintenance, upset, emergency, release, and cleanup conditions must not be permanently embedded in the reusable Location, Function, Process, or Task definition.

Operating condition belongs on:

- Chemical Use
- Exposure Scenario
- Sampling context
- Incident or Observation context

---

# 3. Correct High-Level Data Model

```text
Organization
├── Parent Organization
├── People
├── Organization–Location Assignments
└── Organization–Function Responsibilities

Geographic Location
├── Country
├── State or Province
├── County or District
└── City or Municipality

Physical Location
├── Site
├── Facility
├── Building
├── Floor
├── Unit
├── Zone
├── Subzone
├── Room
├── Storage Area
├── Outdoor Area
└── Mobile Area

Physical Location
├── Location Function Assignments
├── Process Location Assignments
├── Equipment
├── Site Chemical Inventory
├── Chemical Uses
├── SEGs
├── Exposure Scenarios
├── Findings
├── Incidents
└── Corrective Actions

Operational Function
├── Manufacturing
├── Tolling
├── Packaging
├── Warehousing
├── Distribution
├── Laboratory
├── Research and Development
├── Maintenance
├── Utilities
├── Waste Management
├── Administration
└── Other controlled functions

Operational Function
└── Processes
    └── Tasks
        ├── Equipment
        ├── Chemical Uses
        ├── Hazards
        ├── Controls
        └── Exposure Scenarios
```

---

# 4. Organization Hierarchy

## 4.1 Organization entity

Extend the existing Organization model.

Minimum fields:

```text
id
businessId
name
organizationType
parentOrganizationId
organizationCode
legalEntityCode
countryCode
primaryContactPersonId
status
description
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

## 4.2 Organization types

```text
Corporate Group
Regional Entity
Legal Entity
Country Organization
Business Unit
Site Organization
Department
Function
Contractor
Temporary Agency
Laboratory Provider
Medical Provider
Service Vendor
Waste Vendor
Regulator
Other
```

## 4.3 Organization rules

- Corporate Group may have no parent.
- Regional Entity must have a Corporate Group or another Regional Entity parent.
- Legal Entity must have a valid corporate or regional parent.
- Country Organization must belong to a valid parent Organization.
- Site Organization must belong to a valid country or business Organization.
- Department must belong to an internal Organization.
- External Organizations may remain outside the internal hierarchy when appropriate.
- An Organization cannot be its own parent.
- Circular Organization ancestry is prohibited.
- Archived Organizations remain historically resolvable.
- New active People, Products, assignments, or responsibilities cannot reference an archived Organization without deliberate restoration.
- Moving an Organization must not rewrite historical record attribution.
- Organization hierarchy changes require expected-revision concurrency.

## 4.4 Example

```text
ADAMA Agricultural Solutions Ltd.
└── ADAMA North America
    └── ADAMA United States
        ├── Tifton Operations
        │   ├── Tifton HSE
        │   ├── Tifton Production
        │   ├── Tifton Quality
        │   └── Tifton Maintenance
        └── Ocilla Operations
            ├── Ocilla HSE
            ├── Ocilla Production
            └── Ocilla Quality
```

---

# 5. Global Geographic and Physical Location Hierarchy

## 5.1 Location node types

Use Location node types only for geography and physical structure.

```text
Country
StateOrProvince
CountyOrDistrict
CityOrMunicipality
Site
Facility
Building
Floor
Unit
Zone
Subzone
Room
StorageArea
OutdoorArea
MobileArea
```

Do not use operational functions such as Packaging, Laboratory, Tolling, Manufacturing, or Warehousing as Location node types.

## 5.2 Parent rules

```text
Country
→ no parent

StateOrProvince
→ Country

CountyOrDistrict
→ StateOrProvince

CityOrMunicipality
→ StateOrProvince or CountyOrDistrict

Site
→ CityOrMunicipality
  or CountyOrDistrict where no municipality applies

Facility
→ Site

Building
→ Site or Facility

Floor
→ Building

Unit
→ Facility, Building, or Floor

Zone
→ Site, Facility, Building, Floor, or Unit

Subzone
→ Zone or Unit

Room
→ Building, Floor, Unit, Zone, or Subzone

StorageArea
→ Site, Facility, Building, Floor, Unit, Zone, or Subzone

OutdoorArea
→ Site or Facility

MobileArea
→ Site
```

## 5.3 Location fields

```text
id
businessId
name
nodeType
parentId
countryCode
stateOrProvinceCode
postalCode
latitude
longitude
addressLine1
addressLine2
resolvedCountryId
resolvedStateOrProvinceId
resolvedCountyOrDistrictId
resolvedCityOrMunicipalityId
resolvedSiteId
status
description
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

## 5.4 Location rules

- Country has no Location parent.
- Every non-Country Location has a valid parent.
- Circular ancestry is prohibited.
- A Location cannot be moved beneath one of its descendants.
- Every physical Location must resolve to one Site.
- Country, StateOrProvince, CountyOrDistrict, and CityOrMunicipality do not resolve to a Site.
- Site resolves to itself.
- Facility and lower physical nodes inherit Site resolution.
- Resolved geography fields must be recalculated atomically after a move.
- Archived geographic nodes remain available for historical records.
- New active operational records cannot reference archived Locations.
- Location name does not determine its Function.
- A Building named “Warehouse” does not automatically receive a Warehousing Function.
- A Facility named “Laboratory” does not automatically become laboratory-only.
- Function assignment is explicit and separately governed.

---

# 6. Integrated ADAMA Example

```text
ADAMA Global                                      [Organization]
└── ADAMA North America                           [Organization]
    └── ADAMA United States                       [Organization]
        └── United States                         [Country]
            └── Georgia                           [StateOrProvince]
                └── Tift County                   [CountyOrDistrict]
                    └── Tifton                    [CityOrMunicipality]
                        └── Tifton Campus          [Site]
                            ├── Main Production    [Facility]
                            │   ├── Building 1     [Building]
                            │   │   ├── Unit 7     [Unit]
                            │   │   │   ├── Raw Material Zone
                            │   │   │   ├── Milling Zone
                            │   │   │   ├── Granulation Zone
                            │   │   │   └── Packaging Zone
                            │   │   └── Unit 8
                            │   └── Tank Farm      [OutdoorArea]
                            ├── Building 3         [Building]
                            │   ├── Quality Lab    [Room]
                            │   ├── Packaging Area [Zone]
                            │   └── Storage Area   [StorageArea]
                            ├── Main Warehouse     [Facility]
                            │   ├── Receiving Zone
                            │   ├── Raw Material Storage
                            │   └── Finished Goods Storage
                            └── Administration     [Facility]
```

The same Tifton Site may hold several Functions:

```text
Tifton Campus
├── Manufacturing
├── Tolling
├── Packaging
├── Warehousing
├── Distribution
├── Laboratory
├── Quality Assurance
├── Maintenance
├── Utilities
├── Waste Management
├── Emergency Response
└── Administration
```

Building 3 may also have several Functions:

```text
Building 3
├── Packaging
├── Laboratory
├── Quality Assurance
└── Warehousing
```

---

# 7. Operational Function Catalog

## 7.1 OperationalFunction entity

Create a reusable controlled Function entity.

Minimum fields:

```text
id
businessId
name
functionCategory
description
status
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

## 7.2 Function categories

```text
Corporate Management
Regional Management
Site Management
Manufacturing
Formulation
Toll Manufacturing
Tolling
Packaging
Repackaging
Warehousing
Raw Material Storage
Finished Goods Storage
Bulk Storage
Distribution
Shipping
Receiving
Rail Operations
Truck Operations
Laboratory
Quality Control
Quality Assurance
Research and Development
Pilot Plant
Maintenance
Engineering
Utilities
Waste Management
Environmental Operations
Industrial Hygiene
Occupational Health
HSE
Emergency Response
Security
Administration
Training
Contractor Support
Other
```

## 7.3 Function rules

- Function name is required.
- Function identity is reusable across Locations.
- Function identity is not duplicated per Site.
- A Function may be assigned to many Locations.
- A Location may receive many Functions.
- A Function does not establish a Process automatically.
- A Function does not establish a SEG automatically.
- A Function does not establish chemical use automatically.
- Function assignments may be effective-dated.
- Archived Functions remain visible historically.
- New active assignments cannot reference archived Functions.

---

# 8. Location Function Assignment

## 8.1 Purpose

Represent which operational Functions occur at a Location.

Create:

```text
LocationFunctionAssignment
```

## 8.2 Fields

```text
id
businessId
locationId
operationalFunctionId
assignmentType
effectiveFrom
effectiveTo
isPrimary
scopeDescription
responsibleOrganizationId
responsiblePersonId
status
notes
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

## 8.3 Assignment types

```text
Primary Function
Supporting Function
Occasional Function
Contracted Function
Tolling Function
Shared Function
Emergency Function
Temporary Function
Planned Function
Other
```

## 8.4 Rules

- Location is required.
- Operational Function is required.
- Location and Function must exist.
- A Location may hold several active Functions.
- Duplicate active assignments for the same Location and Function are prohibited unless scopes or effective periods differ meaningfully.
- Effective end cannot precede effective start.
- `isPrimary` does not mean exclusive.
- Several Functions may be marked primary when the Location is genuinely multi-functional.
- Responsible Organization is optional.
- Responsible Person is optional.
- Responsible Organization and Person must exist when supplied.
- Assignment history must remain visible.
- Ending a Function assignment must not delete Processes, Chemical Uses, or Exposure Scenarios.
- New Processes may require an active compatible Function assignment.
- Function assignment does not create operational records automatically.

## 8.5 Example

```text
Location: Building 3

Assignments:
- Packaging                  [Primary Function]
- Laboratory                 [Primary Function]
- Quality Assurance          [Supporting Function]
- Finished Goods Storage     [Supporting Function]
- Maintenance                [Occasional Function]
```

---

# 9. Organization Location Assignment

## 9.1 Purpose

Connect Organizations to geographic and physical Locations without implying ownership of geography.

Create:

```text
OrganizationLocationAssignment
```

## 9.2 Fields

```text
id
businessId
organizationId
locationId
relationshipType
effectiveFrom
effectiveTo
isPrimary
scopeDescription
status
notes
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

## 9.3 Relationship types

```text
Owns
Leases
Operates
Manages
Occupies
Supports
Provides HSE Support To
Provides Laboratory Support To
Provides Maintenance Support To
Provides Medical Support To
Has Regulatory Jurisdiction Over
Contracts Work At
Other
```

## 9.4 Rules

- Organization and Location are required.
- One Organization may relate to many Locations.
- One Location may relate to many Organizations.
- Relationship type must be explicit.
- ADAMA Organizations must not be represented as owners of Countries, States, Counties, or Cities.
- Ownership and leasing relationships generally apply to Site or lower physical Locations.
- Support and jurisdiction relationships may apply more broadly.
- Effective dates are retained historically.
- Ending an assignment does not rewrite operational history.

---

# 10. Organization Function Responsibility

## 10.1 Purpose

Identify which Organization is responsible for a Function at a Location or within an enterprise scope.

Create:

```text
OrganizationFunctionResponsibility
```

## 10.2 Fields

```text
id
businessId
organizationId
operationalFunctionId
locationId
responsibilityType
effectiveFrom
effectiveTo
isPrimary
scopeDescription
status
notes
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

## 10.3 Responsibility types

```text
Accountable
Responsible
Supporting
Consulted
Oversight
Contracted Operator
Service Provider
Regulatory Authority
Other
```

---

# 11. Process and Function Relationship

Extend Process with:

```text
operationalFunctionId
primaryLocationId
resolvedSiteId
```

A Process must belong to one primary Operational Function.

```text
Function:
Packaging

Processes:
- Bag filling
- Bag sealing
- Palletizing
- Label application
```

Rules:

- Process must reference an active Operational Function.
- Primary Location must have an active compatible Location Function Assignment.
- Process must resolve to one Site.
- Process may span several Locations.
- Process name must not be used to infer Function.
- Function changes require relationship revalidation.
- Archived Functions cannot receive new active Processes.
- Historical Processes remain linked to historical Function assignments.

---

# 12. Process Location Assignment

Create:

```text
ProcessLocationAssignment
```

Fields:

```text
id
businessId
processId
locationId
relationshipType
sequence
effectiveFrom
effectiveTo
status
notes
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

Relationship types:

```text
Primary
Source
Destination
Transfer Path
Supporting
Storage
Staging
Waste Destination
Emergency Support
Other
```

Example:

```text
Bulk Solvent Receipt Process
├── Rail Spur                 [Source]
├── Unloading Station         [Primary]
├── Transfer Line             [Transfer Path]
├── Bulk Tank 1               [Destination]
└── Containment Area          [Supporting]
```

Rules:

- Process and Location are required.
- Every assigned Location must resolve to the same Site unless a deliberate cross-Site Process type is later introduced.
- Exactly one active Primary assignment is required.
- Source and Destination may have several assignments.
- Sequence is optional except where flow order matters.
- Effective-dated history is retained.
- Ending an assignment does not erase historical Tasks, Chemical Uses, or Exposure Scenarios.

---

# 13. Task Model Correction

Remove or deprecate:

```text
Task.operatingCondition
```

A reusable Task describes what is done, not the condition under which every execution occurs.

Use:

```text
id
businessId
name
taskType
processId
locationId
resolvedSiteId
description
routineClassification
status
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

Routine classification:

```text
Normally Routine
Normally Non-Routine
May Be Routine or Non-Routine
Emergency Only
Unknown
```

This classification is descriptive only.

```text
Task:
Clear blocked duct

Possible operating conditions:
- Planned maintenance
- Upset
- Product release
- Post-release cleanup
- Emergency
```

---

# 14. Resolved Geography and Site Fields

Add:

```text
resolvedCountryId
resolvedStateOrProvinceId
resolvedCountyOrDistrictId
resolvedCityOrMunicipalityId
resolvedSiteId
```

These fields support:

```text
Show all ADAMA Sites in the United States.
Show all incidents in Georgia.
Show all Chemical Products used in Tift County.
Show all Warehousing Functions at Tifton.
Show all Packaging Processes in North America.
Show all SEGs at Ocilla.
```

When Location ancestry changes, recalculate and validate:

- Descendant Locations
- Location Function Assignments
- Organization Location Assignments
- Organization Function Responsibilities
- Processes
- Process Location Assignments
- Tasks
- Equipment
- Site Chemical Inventory
- Chemical Uses
- SEGs
- Exposure Scenarios
- Sampling records
- Findings
- Incidents
- Corrective Actions

The mutation must be atomic.

If any dependent relationship becomes invalid, the move must fail and roll back completely.

---

# 15. Chemical Model Integration

## 15.1 Site Chemical Inventory

Inventory remains connected to:

```text
Chemical Product
→ Site
→ Storage Location
```

A storage Location may support several Functions.

```text
Storage Area A
├── Raw Material Storage
├── Tolling Support
└── Packaging Support
```

Inventory does not need to choose only one Function.

## 15.2 Chemical Use

Chemical Use remains connected to:

```text
Product
→ Site
→ Location
→ Process
→ Task
→ Operating Condition
```

Add derived or explicit Function context:

```text
operationalFunctionId
```

The Function should normally derive from the selected Process.

Rules:

- Product must exist.
- Site must exist.
- Location must resolve to Site.
- Process must resolve to Site.
- Task must belong to Process.
- Function must match the Process Function.
- Location must have an active compatible Function assignment.
- A multi-functional Location may support several different Chemical Uses.
- Chemical Use operating condition remains scenario-specific.
- Chemical Use does not make an Exposure Determination.

---

# 16. Person and Workforce Integration

A Person may have:

```text
organizationId
primarySiteId
department
supervisorPersonId
```

Reserve:

```text
PersonLocationAssignment
PersonFunctionAssignment
```

## 16.1 Person Location Assignment

```text
personId
locationId
assignmentType
effectiveFrom
effectiveTo
```

Assignment types:

```text
Primary Work Location
Regular Work Location
Occasional Work Location
Temporary Assignment
Contract Assignment
Emergency Assignment
Other
```

## 16.2 Person Function Assignment

```text
personId
operationalFunctionId
locationId
roleTitle
effectiveFrom
effectiveTo
```

This supports workers who perform several Functions at one or more Locations.

---

# 17. SEG and Exposure Integration

Future SEG construction must use the corrected model.

```text
Person
+ Organization
+ Location Assignment
+ Function Assignment
+ Process
+ Task
+ Work Pattern
= SEG membership basis
```

Exposure Scenario becomes:

```text
SEG
+ Site-resolvable Location
+ Operational Function
+ Process
+ Task
+ Exposure Agent
+ Operating Condition
+ Frequency
+ Duration
+ Controls
= Exposure Scenario
```

A multi-functional Location may contain several distinct SEGs and Scenarios.

```text
Building 3
├── Packaging Operators SEG
├── Laboratory Analysts SEG
├── Warehouse Workers SEG
└── Maintenance Technicians SEG
```

---

# 18. User Interface Requirements

## 18.1 Enterprise navigator

The UI may present an integrated navigator:

```text
ADAMA Global
└── ADAMA North America
    └── ADAMA United States
        └── United States
            └── Georgia
                └── Tifton
                    └── Tifton Campus
```

The interface must visually distinguish:

- Organization nodes
- Geographic nodes
- Physical Location nodes
- Operational Function assignments

## 18.2 Location detail

Location detail must show:

```text
Overview
Parent and ancestry
Resolved geography
Owning or operating Organizations
Assigned Functions
Processes
Equipment
Chemical Inventory
Chemical Uses
People and SEGs
Exposure Scenarios
Findings and Actions
Record History
Data Quality
```

## 18.3 Function assignment panel

Allow users to assign several Functions to one Location.

```text
Assigned Functions

[x] Manufacturing
[x] Tolling
[x] Packaging
[x] Laboratory
[x] Warehousing
[ ] Distribution
[x] Maintenance
[x] Utilities
```

Do not use a single-select Function field.

## 18.4 Process create workflow

```text
Select Site
→ Select Location
→ Select Operational Function
→ Confirm active Location Function Assignment
→ Enter Process
→ Add supporting Locations
→ Save
```

## 18.5 Filters

Support:

```text
Country
State or Province
County or District
City or Municipality
Site
Location type
Operational Function
Organization
Status
Archived
```

---

# 19. Migration Requirements

## 19.1 Existing Location migration

Current hierarchy:

```text
Country
→ StateOrRegion
→ Site
→ lower nodes
```

Target hierarchy:

```text
Country
→ StateOrProvince
→ optional CountyOrDistrict
→ CityOrMunicipality
→ Site
→ lower nodes
```

Migration must:

- Rename `StateOrRegion` to `StateOrProvince` where unambiguous.
- Preserve existing Site IDs.
- Create City or Municipality only when source data is explicit.
- Create Data Quality Findings when City is unknown.
- Never invent County.
- Preserve historical parent relationships in migration evidence.
- Recalculate all resolved geography fields.
- Preserve revisions and archive states.

## 19.2 Existing Organization migration

Migration must:

- Preserve Organization IDs and business IDs.
- Add `parentOrganizationId` only when hierarchy is explicit.
- Do not infer legal relationships from names alone.
- Create findings for ambiguous internal/external Organization classification.
- Preserve current Product manufacturer and supplier links.

## 19.3 Existing Process migration

Migration must:

- Preserve Process IDs.
- Assign an Operational Function only when mapping is explicit.
- Map current Process types as candidates:
  - Production → Manufacturing
  - Warehouse → Warehousing
  - Laboratory → Laboratory
  - Maintenance → Maintenance
  - Utilities → Utilities
  - Administrative → Administration
- Create findings for ambiguous Process types.
- Preserve primary Location.
- Create Primary Process Location Assignment.
- Do not invent supporting Locations.

## 19.4 Existing Task migration

Migration must:

- Preserve Task IDs.
- Convert fixed operating condition into migration evidence or a default routine classification.
- Do not discard condition history.
- Do not make the migrated default a professional Exposure Scenario conclusion.
- Preserve Process and Location links.

## 19.5 Existing Chemical Use migration

Migration must:

- Preserve Product, Site, Location, Process, and Task relationships.
- Derive Function from Process only when valid.
- Create findings if the selected Location lacks the required Function assignment.
- Preserve operating condition.

---

# 20. Schema Migration

Use a new immutable IndexedDB version.

If the Chemical schema hotfix becomes version 3, this campaign should use:

```text
Database version 4
```

Do not modify an already released migration.

Add stores:

```text
operational_functions
location_function_assignments
organization_location_assignments
organization_function_responsibilities
process_location_assignments
```

Potential future stores:

```text
person_location_assignments
person_function_assignments
```

Required indexes:

```text
Organizations:
- byParentOrganization
- byOrganizationType
- byCountryCode

Locations:
- byParent
- byNodeType
- byResolvedCountry
- byResolvedStateOrProvince
- byResolvedCountyOrDistrict
- byResolvedCityOrMunicipality
- byResolvedSite

Operational Functions:
- byName
- byFunctionCategory
- byLifecycleStatus

Location Function Assignments:
- byLocation
- byFunction
- byLocationAndFunction
- byResponsibleOrganization
- byEffectiveFrom
- byStatus

Organization Location Assignments:
- byOrganization
- byLocation
- byRelationshipType
- byOrganizationAndLocation

Organization Function Responsibilities:
- byOrganization
- byFunction
- byLocation
- byResponsibilityType

Process Location Assignments:
- byProcess
- byLocation
- byRelationshipType
- byProcessAndLocation

Processes:
- byOperationalFunction
- byPrimaryLocation
- byResolvedSite
```

---

# 21. Required Tests

## 21.1 Organization tests

- Create Corporate Group.
- Create Regional Entity.
- Create Country Organization.
- Reject self-parent.
- Reject descendant-parent cycle.
- Preserve archived ancestors.
- Move Organization with expected revision.
- Reject archived parent for new active Organization.

## 21.2 Location tests

- Create Country.
- Create State or Province.
- Create County or District.
- Create City or Municipality.
- Create Site.
- Create Facility.
- Create Building.
- Create Unit.
- Create Room.
- Create Storage Area.
- Validate parent-type rules.
- Reject circular ancestry.
- Resolve Country, State, County, City, and Site.
- Recalculate descendants after move.
- Roll back invalid dependent moves.

## 21.3 Function tests

- Create Operational Function.
- Assign several Functions to one Location.
- Assign one Function to several Locations.
- Reject duplicate active assignment.
- Permit meaningful effective-dated assignment history.
- End one Function without affecting others.
- Preserve historical Process links.

## 21.4 Organization Location tests

- Assign one Organization to several Sites.
- Assign several Organizations to one Site.
- Distinguish Owns, Operates, Manages, and Supports.
- Reject geographic ownership assignment where prohibited.
- Preserve ended assignments.

## 21.5 Process tests

- Create Process under an active Function.
- Require compatible Location Function Assignment.
- Assign one Process to several Locations.
- Require one Primary Location.
- Reject cross-Site assignment.
- Preserve source and destination assignments.

## 21.6 Task tests

- Create reusable Task without fixed operating condition.
- Preserve routine classification.
- Reject Process mismatch.
- Reject cross-Site Location.
- Migrate old operating condition without silent data loss.

## 21.7 Chemical integration tests

- Inventory at a multi-functional Location.
- Chemical Use under Packaging Function.
- Chemical Use under Tolling Function at the same Location.
- Reject Chemical Use when Process Function is not assigned to Location.
- Permit several Functions and Chemical Uses at one Location.
- Preserve operating condition separately.

## 21.8 Migration tests

- Existing Foundation database upgrade.
- Existing Chemical database upgrade.
- Existing StateOrRegion conversion.
- Missing City finding.
- Multi-function Location migration.
- Process type to Function candidate.
- Ambiguous Process Function finding.
- Task condition preservation.
- Full rollback after failed migration.
- Idempotent reopen.

---

# 22. Architecture Boundaries

Typed enterprise and Location modules must not import:

```text
legacy local persistence
generic campaign registers
Tauri persistence
Rust commands
raw localStorage
```

Create modules:

```text
src/lib/domain/enterprise/
src/lib/domain/location/
src/lib/domain/operations/

src/lib/data/repositories/enterprise/
src/lib/data/repositories/location/
src/lib/data/repositories/operations/

src/lib/application/enterprise/
src/lib/application/location/
src/lib/application/operations/
```

The existing Foundation module may be split carefully, but historical revisions and IDs must be preserved.

---

# 23. Campaign Sequence

```text
1. Fix released Chemical schema upgrade.
2. Add hierarchical Organizations.
3. Expand global geographic and physical Location hierarchy.
4. Add Operational Function catalog.
5. Add Location Function Assignments.
6. Add Organization Location Assignments.
7. Add Organization Function Responsibilities.
8. Add Process Location Assignments.
9. Link Processes to Operational Functions.
10. Remove fixed operating condition from Task.
11. Revalidate Chemical Inventory and Chemical Use.
12. Add integrated enterprise navigator.
13. Migrate existing records.
14. Add architecture boundaries and tests.
15. Complete verification.
```

---

# 24. Recommended Branch and Commits

Branch:

```text
codex/global-enterprise-location-functions
```

Recommended commits:

```text
feat(domain): add hierarchical organizations and global locations
```

```text
feat(domain): add reusable operational functions
```

```text
feat(data): add location and organization assignment stores
```

```text
feat(application): enforce multi-function location relationships
```

```text
feat(operations): add process location and function assignments
```

```text
refactor(domain): remove scenario condition from reusable tasks
```

```text
feat(ui): add enterprise location and function navigator
```

```text
feat(migration): upgrade enterprise and location records
```

```text
test: verify global hierarchy and multi-function locations
```

---

# 25. Definition of Done

The campaign is complete when:

- ADAMA Corporate and regional structure are represented through hierarchical Organizations.
- Country, State or Province, County or District, City or Municipality, Site, and physical sublocations are represented correctly.
- Corporate is not stored as a physical Location.
- Geographic nodes are not treated as owned physical assets.
- One Location may hold several Operational Functions.
- One Function may exist at several Locations.
- Functions are not encoded as Location node types.
- Processes reference a Function.
- Processes may span several Locations.
- Tasks no longer contain a fixed scenario operating condition.
- Chemical Inventory remains separate from Function.
- Chemical Use validates Function, Process, Task, Location, and Site compatibility.
- Organization and Location relationships are explicit.
- Resolved geography and Site fields update atomically.
- Existing IDs, revisions, archive states, and migration evidence are preserved.
- Typed modules do not call legacy persistence.
- Local verification passes.
- Hosted verification passes.

The governing result must support:

```text
One physical Location
+ several Operational Functions
+ several Processes
+ several Tasks
+ several worker groups
+ several Chemical Uses
+ several Exposure Scenarios
```

without duplicating the Location or forcing it into one exclusive category.
