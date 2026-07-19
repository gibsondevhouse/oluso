# Entity field specification index

Status: Implemented Foundation and enterprise baseline
Last updated: 2026-07-19

The former broad campaign-era field list is superseded. Canonical entity responsibilities and required relationships are defined in [04-domain-model.md](../04-domain-model.md).

Implementation field schemas must be added per bounded domain and include:

- Common [record identity/revision fields](record-identity.md).
- Typed domain fields and controlled values.
- Required/optional rules by lifecycle stage.
- Relationship targets and archive/supersession behavior.
- Validation and cross-record invariants.
- Exchange schema version and compatibility behavior.
- Migration mapping from each supported legacy source.
- Sensitive/prohibited data classification.

Required schema groups, in build order:

1. Organization, OrganizationLocationAssignment, and OrganizationFunctionResponsibility.
2. Person plus reserved PersonLocationAssignment and PersonFunctionAssignment contracts.
3. Global geographic/physical Location, OperationalFunction, and LocationFunctionAssignment.
4. Process, ProcessLocationAssignment, Task, and Equipment.
5. ChemicalSubstance, ChemicalProduct, SDSRevision, SiteChemicalInventory, ChemicalUse.
6. ExposureAgent, ExposureLimit, Control, DocumentReference.
7. SEG, SEGMembership, ExposureScenario.
8. ExposureAssessment, ExposureDetermination.
9. SamplingPlan, SamplingEvent, Sample, LaboratoryResult, ExposureLimitComparison, ProfessionalInterpretation.
10. ControlVerification, ProgramApplicability, MedicalSurveillanceRequirement.
11. Assurance/action/verification entities.
12. RecordRevision, Review, Approval, ExchangePackage, ImportRun, ConflictResolution, DataQualityFinding.

The implemented enterprise baseline deliberately keeps Organization hierarchy, geographic hierarchy, physical Location hierarchy, and Operational Function assignments in separate typed entities. A reusable Task carries `routineClassification`; scenario operating condition remains on Chemical Use, Exposure Scenario, sampling, and event context.

Do not restore a single catch-all campaign field schema for these groups.
