# Entity field specification index

Status: Reset baseline
Last updated: 2026-07-18

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

1. Organization, Person, Location.
2. Process, Task, Equipment.
3. ChemicalSubstance, ChemicalProduct, SDSRevision, SiteChemicalInventory, ChemicalUse.
4. ExposureAgent, ExposureLimit, Control, DocumentReference.
5. SEG, SEGMembership, ExposureScenario.
6. ExposureAssessment, ExposureDetermination.
7. SamplingPlan, SamplingEvent, Sample, LaboratoryResult, ExposureLimitComparison, ProfessionalInterpretation.
8. ControlVerification, ProgramApplicability, MedicalSurveillanceRequirement.
9. Assurance/action/verification entities.
10. RecordRevision, Review, Approval, ExchangePackage, ImportRun, ConflictResolution, DataQualityFinding.

Do not restore a single catch-all campaign field schema for these groups.
