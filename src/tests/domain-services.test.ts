import { describe, expect, it, vi } from "vitest";
import type {
  DomainRepositorySet,
  IdentifiedLifecycleRecord,
  RegisterListOptions,
  RegisterRepository,
  TransactionCoordinator,
} from "../domain/contracts";
import {
  ArchiveError,
  DuplicateRecordError,
  RelationshipError,
  RepositoryError,
  RestoreError,
  ValidationError,
} from "../domain/errors";
import { createDomainServices } from "../domain/services";
import type { ChemicalInput, ChemicalRecord } from "$lib/persistence/chemical.types";
import type { ControlInput, ControlRecord } from "$lib/persistence/control.types";
import type {
  CorrectiveActionInput,
  CorrectiveActionRecord,
} from "$lib/persistence/corrective-action.types";
import type { EquipmentInput, EquipmentRecord } from "$lib/persistence/equipment.types";
import type { FindingInput, FindingRecord } from "$lib/persistence/finding.types";
import type { HazardInput, HazardRecord } from "$lib/persistence/hazard.types";
import type { LocationInput, LocationRecord } from "$lib/persistence/location.types";
import type { ProcessInput, ProcessRecord } from "$lib/persistence/process.types";
import type {
  RiskAssessmentInput,
  RiskAssessmentRecord,
} from "$lib/persistence/risk-assessment.types";
import type { SegInput, SegRecord } from "$lib/persistence/seg.types";

function activeLifecycle() {
  return {
    archivedAt: null,
    archivedReason: null,
    lifecycleStatus: "active" as const,
  };
}

function createMockRepository<TRecord extends IdentifiedLifecycleRecord, TInput extends object>(
  records: TRecord[] = [],
): RegisterRepository<TRecord, TInput> {
  return {
    create: vi.fn((input: TInput) => {
      const id = ((input as { id?: string }).id ?? `created-${records.length + 1}`).trim();
      const record = {
        ...input,
        id,
        createdAt: "2026-07-09T12:00:00.000Z",
        updatedAt: "2026-07-09T12:00:00.000Z",
        ...activeLifecycle(),
      } as unknown as TRecord;
      records.push(record);
      return record;
    }),
    update: vi.fn((id: string, input: TInput) => {
      const existingIndex = records.findIndex((record) => record.id === id);
      if (existingIndex === -1) {
        throw new Error("Repository did not find record.");
      }

      const record = {
        ...records[existingIndex],
        ...input,
        id,
        updatedAt: "2026-07-09T12:30:00.000Z",
      } as TRecord;
      records[existingIndex] = record;
      return record;
    }),
    archive: vi.fn((id: string, reason?: string) => {
      const record = records.find((item) => item.id === id);
      if (!record) {
        throw new Error("Repository did not find record.");
      }

      const archived = {
        ...record,
        lifecycleStatus: "archived" as const,
        archivedAt: "2026-07-09T12:30:00.000Z",
        archivedReason: reason ?? null,
      };
      Object.assign(record, archived);
      return record;
    }),
    restore: vi.fn((id: string) => {
      const record = records.find((item) => item.id === id);
      if (!record) {
        throw new Error("Repository did not find record.");
      }

      const restored = {
        ...record,
        lifecycleStatus: "active" as const,
        archivedAt: null,
        archivedReason: null,
      };
      Object.assign(record, restored);
      return record;
    }),
    getById: vi.fn((id: string) => records.find((record) => record.id === id) ?? null),
    list: vi.fn((options: RegisterListOptions = {}) =>
      options.includeArchived
        ? records
        : records.filter((record) => record.lifecycleStatus !== "archived"),
    ),
  };
}

const locationRecord: LocationRecord = {
  id: "loc-1",
  name: "Main Plant",
  type: "Facility",
  description: "",
  status: "active",
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  ...activeLifecycle(),
};

const archivedLocationRecord: LocationRecord = {
  ...locationRecord,
  id: "loc-archived",
  lifecycleStatus: "archived",
  archivedAt: "2026-07-09T12:30:00.000Z",
  archivedReason: "Closed.",
};

const processRecord: ProcessRecord = {
  id: "process-1",
  name: "Blending",
  locationId: "loc-1",
  category: "Formulation",
  description: "",
  status: "active",
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  ...activeLifecycle(),
};

const equipmentRecord: EquipmentRecord = {
  id: "equipment-1",
  name: "Dust Collector",
  type: "Dust Collector",
  locationId: "loc-1",
  processId: "process-1",
  description: "",
  status: "active",
  notes: "",
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  ...activeLifecycle(),
};

const findingRecord: FindingRecord = {
  id: "finding-1",
  title: "Blocked egress",
  type: "Inspection Finding",
  description: "",
  locationId: "loc-1",
  processId: "",
  hazardId: "",
  severity: "High",
  status: "Open",
  reportedBy: "HSE Lead",
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  ...activeLifecycle(),
};

const hazardRecord: HazardRecord = {
  id: "hazard-1",
  title: "Slip hazard",
  category: "Physical",
  locationId: "loc-1",
  locationIds: ["loc-1"],
  processIds: ["process-1"],
  chemicalIds: [],
  severity: "Medium",
  likelihood: "Possible",
  description: "",
  controls: "",
  status: "active",
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  ...activeLifecycle(),
};

const controlRecord: ControlRecord = {
  id: "control-1",
  name: "Non-slip matting",
  type: "Engineering",
  hazardIds: ["hazard-1"],
  description: "",
  owner: "Facilities",
  verificationMethod: "Inspection",
  verificationFrequency: "Monthly",
  lastVerifiedAt: "",
  status: "active",
  notes: "",
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  ...activeLifecycle(),
};

const riskAssessmentRecord: RiskAssessmentRecord = {
  id: "risk-1",
  title: "Slip risk assessment",
  hazardId: "hazard-1",
  controlIds: ["control-1"],
  inherentSeverity: "Medium",
  inherentLikelihood: "Likely",
  residualSeverity: "Medium",
  residualLikelihood: "Possible",
  assessor: "HSE Lead",
  reviewStatus: "Draft",
  nextReviewDate: "",
  notes: "",
  createdAt: "2026-07-09T12:00:00.000Z",
  updatedAt: "2026-07-09T12:00:00.000Z",
  ...activeLifecycle(),
};

function createRepositorySet(overrides: Partial<DomainRepositorySet> = {}): DomainRepositorySet {
  return {
    locations: createMockRepository<LocationRecord, LocationInput>([
      { ...locationRecord },
      { ...archivedLocationRecord },
    ]),
    processes: createMockRepository<ProcessRecord, ProcessInput>([{ ...processRecord }]),
    equipment: createMockRepository<EquipmentRecord, EquipmentInput>([{ ...equipmentRecord }]),
    chemicals: createMockRepository<ChemicalRecord, ChemicalInput>(),
    hazards: createMockRepository<HazardRecord, HazardInput>([{ ...hazardRecord }]),
    controls: createMockRepository<ControlRecord, ControlInput>([{ ...controlRecord }]),
    riskAssessments: createMockRepository<RiskAssessmentRecord, RiskAssessmentInput>([
      { ...riskAssessmentRecord },
    ]),
    segs: createMockRepository<SegRecord, SegInput>(),
    findings: createMockRepository<FindingRecord, FindingInput>([{ ...findingRecord }]),
    correctiveActions: createMockRepository<CorrectiveActionRecord, CorrectiveActionInput>(),
    ...overrides,
  };
}

describe("domain services", () => {
  it("rejects invalid input before reaching repositories", () => {
    const repositories = createRepositorySet();
    const services = createDomainServices(repositories);

    expect(() =>
      services.locations.create({
        name: "",
        type: "Facility",
        description: "",
        status: "active",
      }),
    ).toThrow(ValidationError);
    expect(repositories.locations.create).not.toHaveBeenCalled();
  });

  it("rejects invalid relationships before persistence", () => {
    const repositories = createRepositorySet();
    const services = createDomainServices(repositories);

    expect(() =>
      services.findings.create({
        title: "Missing location relationship",
        type: "Observation",
        description: "",
        locationId: "missing-location",
        processId: "",
        hazardId: "",
        severity: "Low",
        status: "Open",
        reportedBy: "Tester",
      }),
    ).toThrow(RelationshipError);
    expect(repositories.findings.create).not.toHaveBeenCalled();
  });

  it("validates equipment location and optional process relationships", () => {
    const repositories = createRepositorySet();
    const services = createDomainServices(repositories);

    expect(() =>
      services.equipment.create({
        name: "Missing location equipment",
        type: "Mixer",
        locationId: "missing-location",
        processId: "",
        description: "",
        status: "active",
        notes: "",
      }),
    ).toThrow(RelationshipError);

    expect(() =>
      services.equipment.create({
        name: "Missing process equipment",
        type: "Mixer",
        locationId: "loc-1",
        processId: "missing-process",
        description: "",
        status: "active",
        notes: "",
      }),
    ).toThrow(RelationshipError);

    expect(
      services.equipment.create({
        name: "Validated mixer",
        type: "Mixer",
        locationId: "loc-1",
        processId: "process-1",
        description: "",
        status: "active",
        notes: "",
      }),
    ).toMatchObject({
      name: "Validated mixer",
      locationId: "loc-1",
      processId: "process-1",
    });
  });

  it("validates control hazard relationships", () => {
    const repositories = createRepositorySet();
    const services = createDomainServices(repositories);

    expect(() =>
      services.controls.create({
        name: "Missing hazard control",
        type: "Engineering",
        hazardIds: ["missing-hazard"],
        description: "",
        owner: "",
        verificationMethod: "",
        verificationFrequency: "",
        lastVerifiedAt: "",
        status: "active",
        notes: "",
      }),
    ).toThrow(RelationshipError);

    expect(
      services.controls.create({
        name: "Validated control",
        type: "Engineering",
        hazardIds: ["hazard-1"],
        description: "",
        owner: "",
        verificationMethod: "",
        verificationFrequency: "",
        lastVerifiedAt: "",
        status: "active",
        notes: "",
      }),
    ).toMatchObject({
      name: "Validated control",
      hazardIds: ["hazard-1"],
    });
  });

  it("validates risk assessment hazard and control relationships", () => {
    const repositories = createRepositorySet();
    const services = createDomainServices(repositories);

    expect(() =>
      services.riskAssessments.create({
        title: "Missing hazard risk assessment",
        hazardId: "missing-hazard",
        controlIds: [],
        inherentSeverity: "Medium",
        inherentLikelihood: "Likely",
        residualSeverity: "Low",
        residualLikelihood: "Possible",
        assessor: "",
        reviewStatus: "Draft",
        nextReviewDate: "",
        notes: "",
      }),
    ).toThrow(RelationshipError);

    expect(() =>
      services.riskAssessments.create({
        title: "Missing control risk assessment",
        hazardId: "hazard-1",
        controlIds: ["missing-control"],
        inherentSeverity: "Medium",
        inherentLikelihood: "Likely",
        residualSeverity: "Low",
        residualLikelihood: "Possible",
        assessor: "",
        reviewStatus: "Draft",
        nextReviewDate: "",
        notes: "",
      }),
    ).toThrow(RelationshipError);

    expect(
      services.riskAssessments.create({
        title: "Validated risk assessment",
        hazardId: "hazard-1",
        controlIds: ["control-1"],
        inherentSeverity: "Medium",
        inherentLikelihood: "Likely",
        residualSeverity: "Low",
        residualLikelihood: "Possible",
        assessor: "HSE Lead",
        reviewStatus: "Draft",
        nextReviewDate: "",
        notes: "",
      }),
    ).toMatchObject({
      title: "Validated risk assessment",
      hazardId: "hazard-1",
      controlIds: ["control-1"],
    });
  });

  it("prevents duplicate explicit IDs before create", () => {
    const repositories = createRepositorySet();
    const services = createDomainServices(repositories);

    expect(() =>
      services.locations.create({
        id: "loc-1",
        name: "Duplicate",
        type: "Facility",
        description: "",
        status: "active",
      } as LocationInput),
    ).toThrow(DuplicateRecordError);
    expect(repositories.locations.create).not.toHaveBeenCalled();
  });

  it("protects archive and restore lifecycle rules", () => {
    const repositories = createRepositorySet();
    const services = createDomainServices(repositories);

    expect(() => services.locations.archive("loc-archived")).toThrow(ArchiveError);
    expect(() => services.locations.restore("loc-1")).toThrow(RestoreError);
    expect(repositories.locations.archive).not.toHaveBeenCalled();
    expect(repositories.locations.restore).not.toHaveBeenCalled();
  });

  it("coordinates lifecycle writes through the injected transaction coordinator", () => {
    const repositories = createRepositorySet();
    const transactionCoordinator: TransactionCoordinator = {
      runInTransaction: vi.fn((operation) => operation()) as TransactionCoordinator["runInTransaction"],
    };
    const services = createDomainServices(repositories, transactionCoordinator);

    services.locations.archive("loc-1", "No longer used.");

    expect(transactionCoordinator.runInTransaction).toHaveBeenCalledTimes(1);
    expect(repositories.locations.archive).toHaveBeenCalledWith("loc-1", "No longer used.");
  });

  it("wraps repository failures in domain repository errors", () => {
    const failingLocations = createMockRepository<LocationRecord, LocationInput>([locationRecord]);
    vi.mocked(failingLocations.create).mockImplementation(() => {
      throw new Error("Disk write failed.");
    });
    const services = createDomainServices(createRepositorySet({ locations: failingLocations }));

    expect(() =>
      services.locations.create({
        name: "Warehouse",
        type: "Storage",
        description: "",
        status: "active",
      }),
    ).toThrow(RepositoryError);
  });

  it("validates corrective action due dates and required finding links", () => {
    const repositories = createRepositorySet();
    const services = createDomainServices(repositories);

    expect(() =>
      services.correctiveActions.create({
        title: "Fix issue",
        type: "Other",
        description: "",
        findingId: "finding-1",
        sourceType: "Finding",
        sourceId: "finding-1",
        sourceJustification: "",
        assignedTo: "HSE Lead",
        priority: "Medium",
        status: "Created",
        dueDate: "07/31/2026",
        completionSummary: "",
        verificationRequired: true,
        verificationMethod: "",
        verificationResult: "",
        evidenceReference: "",
        closureNotes: "",
      }),
    ).toThrow(ValidationError);

    expect(() =>
      services.correctiveActions.create({
        title: "Fix issue",
        type: "Other",
        description: "",
        findingId: "missing-finding",
        sourceType: "Finding",
        sourceId: "missing-finding",
        sourceJustification: "",
        assignedTo: "HSE Lead",
        priority: "Medium",
        status: "Created",
        dueDate: "2026-07-31",
        completionSummary: "",
        verificationRequired: true,
        verificationMethod: "",
        verificationResult: "",
        evidenceReference: "",
        closureNotes: "",
      }),
    ).toThrow(RelationshipError);
  });

  it("searches through service-owned list results without SQLite", () => {
    const services = createDomainServices(createRepositorySet());

    expect(services.locations.search("main")).toHaveLength(1);
    expect(services.locations.search("closed", { includeArchived: true })).toHaveLength(1);
  });
});
