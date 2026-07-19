export type LegacyMappingDisposition = "map" | "split" | "conditional" | "defer";

export interface LegacyCollectionMapping {
  targets: string[];
  disposition: LegacyMappingDisposition;
  note: string;
}

export const LEGACY_COLLECTION_MAPPING: Record<string, LegacyCollectionMapping> = {
  locations: { targets: ["locations"], disposition: "split", note: "Creates geography nodes and operational hierarchy." },
  processes: { targets: ["processes"], disposition: "map", note: "Requires mapped Site-resolvable location." },
  tasks: { targets: ["tasks"], disposition: "map", note: "Requires valid process and location." },
  equipment: { targets: ["equipment"], disposition: "map", note: "Preserves valid context links." },
  chemicals: {
    targets: ["chemical_substances", "chemical_products", "sds_revisions", "site_chemical_inventory", "chemical_uses", "exposure_agents", "exposure_limits"],
    disposition: "split",
    note: "Separates identity, product, SDS, inventory, use, agent, and limit.",
  },
  hazards: { targets: ["hazards"], disposition: "map", note: "Preserved separately from exposure agents." },
  controls: { targets: ["controls"], disposition: "map", note: "Verification event requires explicit evidence/date." },
  riskAssessments: { targets: ["migration_runs", "data_quality_findings"], disposition: "defer", note: "Not reinterpreted as exposure assessment." },
  segs: { targets: ["segs", "data_quality_findings"], disposition: "split", note: "Worker group retained; scenario fields require review." },
  findings: { targets: ["findings"], disposition: "map", note: "Maps assurance context." },
  incidents: { targets: ["incidents"], disposition: "map", note: "Maps assurance context." },
  correctiveActions: { targets: ["corrective_actions"], disposition: "map", note: "Preserves completion/verification/closure." },
  exposureMonitoring: {
    targets: ["sampling_plans", "sampling_events", "samples", "laboratory_results", "data_quality_findings"],
    disposition: "split",
    note: "No automatic comparison, interpretation, or determination.",
  },
  complianceItems: { targets: ["migration_runs", "data_quality_findings"], disposition: "defer", note: "Broad compliance scope deferred." },
  organizations: { targets: ["organizations"], disposition: "map", note: "Canonical organization." },
  people: { targets: ["people"], disposition: "map", note: "Canonical person; clinical data prohibited." },
  segMemberships: { targets: ["seg_memberships"], disposition: "map", note: "Effective dates and dependencies validated." },
  contractorScopes: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  inspections: { targets: ["inspections"], disposition: "map", note: "Assurance record." },
  exposureAgents: { targets: ["exposure_agents"], disposition: "map", note: "Deduplicate with derived agents." },
  exposureLimits: { targets: ["exposure_limits"], disposition: "conditional", note: "Requires explicit value/unit/type/basis/source." },
  exposureAssessments: { targets: ["exposure_assessments", "data_quality_findings"], disposition: "conditional", note: "Requires resolved exposure scenario." },
  exposureDeterminations: { targets: ["exposure_determinations", "data_quality_findings"], disposition: "conditional", note: "Requires valid assessment; judgment is never inferred." },
  samplingCampaigns: { targets: ["sampling_plans", "data_quality_findings"], disposition: "conditional", note: "Plan candidate only." },
  controlVerifications: { targets: ["control_verifications"], disposition: "conditional", note: "Requires control, scenario, date, and evidence." },
  hsePrograms: { targets: ["migration_runs"], disposition: "defer", note: "Program catalog deferred." },
  programApplicabilities: { targets: ["program_applicability"], disposition: "conditional", note: "Administrative basis retained." },
  medicalSurveillance: { targets: ["medical_surveillance_requirements"], disposition: "conditional", note: "Administrative applicability only." },
  trainingCourses: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  trainingRequirements: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  trainingRecords: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  managementChanges: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  changeReviews: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  pssrs: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  regulatoryRequirements: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  permits: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  wasteStreams: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  wasteShipments: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  environmentalSources: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  environmentalInspections: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  environmentalEvents: { targets: ["migration_runs"], disposition: "defer", note: "Future Module." },
  documentReferences: { targets: ["document_references"], disposition: "map", note: "External reference metadata." },
  dataQualityFindings: { targets: ["data_quality_findings"], disposition: "map", note: "Governance record." },
  migrationMappings: { targets: ["migration_runs"], disposition: "defer", note: "Preserved as migration evidence." },
  importRuns: { targets: ["migration_runs"], disposition: "defer", note: "Legacy import history retained as evidence." },
  migrationBundles: { targets: ["migration_runs"], disposition: "defer", note: "Legacy bundle retained as evidence." },
};
