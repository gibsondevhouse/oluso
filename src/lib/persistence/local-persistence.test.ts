import { get } from "svelte/store";
import { beforeEach, describe, expect, it } from "vitest";
import { createOlusoApplication } from "../../application/oluso-application";
import type { ChemicalInput } from "./chemical.types";
import type { ControlInput } from "./control.types";
import type { CorrectiveActionInput } from "./corrective-action.types";
import type { EquipmentInput } from "./equipment.types";
import type { FindingInput } from "./finding.types";
import type { HazardInput } from "./hazard.types";
import type { LocationInput } from "./location.types";
import type { ProcessInput } from "./process.types";
import type { RiskAssessmentInput } from "./risk-assessment.types";
import type { SegInput } from "./seg.types";
import {
  createLocalPersistenceRepository,
  complianceItemRecords,
  controlRecords,
  equipmentRecords,
  exposureMonitoringRecords,
  findingRecords,
  getPersistenceStatusLabel,
  hazardRecords,
  incidentRecords,
  locationRecords,
  persistenceDiagnostics,
  resetPersistenceStoresForTest,
  riskAssessmentRecords,
  type StorageAdapter,
} from "./local-persistence";

function createMemoryStorage(initial: Record<string, string> = {}): StorageAdapter {
  const values = new Map(Object.entries(initial));

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

function createActionInput(overrides: Partial<CorrectiveActionInput> = {}): CorrectiveActionInput {
  const findingId = overrides.findingId ?? overrides.sourceId ?? get(findingRecords)[0]?.id ?? "";

  return {
    title: "Correct action",
    type: "Other",
    description: "",
    findingId,
    sourceType: "Finding",
    sourceId: findingId,
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
    ...overrides,
  };
}

describe("local persistence", () => {
  beforeEach(() => {
    resetPersistenceStoresForTest();
  });

  it("maps persistence states to truthful labels", () => {
    expect(getPersistenceStatusLabel("not_configured")).toBe("Persistence not configured");
    expect(getPersistenceStatusLabel("loading")).toBe("Persistence loading");
    expect(getPersistenceStatusLabel("ready")).toBe("Persistence ready");
    expect(getPersistenceStatusLabel("error")).toBe("Persistence error");
  });

  it("initializes local persistence and seeds Locations when empty", async () => {
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      now: () => new Date("2026-07-09T12:00:00.000Z"),
    });

    await repository.initialize();

    expect(get(persistenceDiagnostics).status).toBe("ready");
    expect(get(locationRecords)).toHaveLength(3);
    expect(get(findingRecords)).toHaveLength(2);
    expect(get(locationRecords)[0]?.id).toBe("loc-demo-main-facility");
    expect(get(locationRecords)[2]?.id).toBe("loc-demo-workshop");
    expect(get(equipmentRecords)[0]?.id).toBe("equipment-demo-dust-collector");
    expect(get(controlRecords)[0]?.id).toBe("control-demo-slip-matting");
    expect(get(riskAssessmentRecords)[0]?.id).toBe("risk-demo-slip-storage-entry");
    expect(get(findingRecords)[0]?.id).toBe("finding-demo-egress");
  });

  it("seeds exposure monitoring, incident, and compliance registers", async () => {
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      now: () => new Date("2026-07-09T12:00:00.000Z"),
    });

    await repository.initialize();

    expect(get(exposureMonitoringRecords)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "exposure-demo-acetone-twa" }),
      ]),
    );
    expect(get(incidentRecords)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "incident-demo-grinding-near-miss" }),
      ]),
    );
    expect(get(complianceItemRecords)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "compliance-demo-air-permit-review" }),
        expect.objectContaining({ id: "compliance-demo-chemical-training" }),
      ]),
    );
  });

  it("creates, reads, updates, archives, and restores a compliance item", async () => {
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      now: () => new Date("2026-07-09T12:00:00.000Z"),
      createId: () => "compliance-test-1",
    });

    await repository.initialize();
    const created = repository.createComplianceItem({
      itemType: "Obligation",
      title: "Quarterly emissions record review",
      requirementSource: "Facility air permit AP-2025-14",
      owner: "Environmental Coordinator",
      audienceOrScope: "Main Facility",
      segId: "",
      locationId: "loc-demo-main-facility",
      processId: "",
      equipmentId: "",
      issueDate: "",
      dueDate: "2026-09-30",
      expirationDate: "",
      reviewDate: "2026-09-15",
      recurrence: "Quarterly",
      status: "Upcoming",
      reviewStatus: "Not Reviewed",
      evidenceRequired: true,
      evidenceReference: "",
      notes: "Readiness tracking only.",
    });

    expect(repository.getRecord("complianceItems", created.id)).toEqual(created);
    expect(repository.listComplianceItems()).toContainEqual(created);

    const updated = repository.updateComplianceItem(created.id, {
      ...created,
      title: "Quarterly emissions records reviewed",
      status: "Complete",
      reviewStatus: "Reviewed",
      evidenceReference: "Review worksheet ENV-2026-Q3",
    });

    expect(updated).toMatchObject({
      title: "Quarterly emissions records reviewed",
      status: "Complete",
      reviewStatus: "Reviewed",
    });

    repository.archiveRecord("complianceItems", created.id, "Superseded obligation.");
    expect(repository.listComplianceItems()).not.toContainEqual(
      expect.objectContaining({ id: created.id }),
    );

    repository.restoreRecord("complianceItems", created.id);
    expect(repository.listComplianceItems()).toContainEqual(
      expect.objectContaining({ id: created.id, lifecycleStatus: "active" }),
    );
  });

  it("exports snapshots and imports only records missing from the current database", async () => {
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      now: () => new Date("2026-07-09T12:00:00.000Z"),
    });
    await repository.initialize();

    const snapshot = repository.exportDatabase();
    snapshot.locations[0] = {
      ...snapshot.locations[0],
      name: "Imported name must not overwrite current data",
    };
    snapshot.complianceItems.push({
      ...snapshot.complianceItems[0],
      id: "compliance-imported-review",
      title: "Imported permit evidence review",
    });

    const result = repository.importDatabase(snapshot);

    expect(result.importedCount).toBe(1);
    expect(repository.getRecord("locations", "loc-demo-main-facility")).toMatchObject({
      name: "Main Facility",
    });
    expect(repository.getRecord("complianceItems", "compliance-imported-review")).toMatchObject({
      title: "Imported permit evidence review",
    });
  });

  it("restores snapshots by replacement and rejects malformed snapshots without changing data", async () => {
    let nextId = 0;
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      now: () => new Date("2026-07-09T12:00:00.000Z"),
      createId: () => `post-backup-${++nextId}`,
    });
    await repository.initialize();

    const snapshot = repository.exportDatabase();
    snapshot.complianceItems[0] = {
      ...snapshot.complianceItems[0],
      title: "Title from restored backup",
    };
    const postBackupLocation = repository.createLocation({
      name: "Created after backup",
      type: "Office",
      description: "Must disappear after replacement restore.",
      status: "active",
    });

    repository.restoreDatabase(snapshot);

    expect(repository.getRecord("locations", postBackupLocation.id)).toBeNull();
    expect(repository.getRecord("complianceItems", "compliance-demo-air-permit-review")).toMatchObject({
      title: "Title from restored backup",
    });

    const beforeMalformedRestore = repository.exportDatabase();
    expect(() =>
      repository.restoreDatabase({
        schemaVersion: beforeMalformedRestore.schemaVersion,
        locations: "not-an-array",
      }),
    ).toThrow("Persisted locations data is invalid.");
    expect(repository.exportDatabase()).toEqual(beforeMalformedRestore);
  });

  it("creates, reads, and updates a Location", async () => {
    let nextId = 0;
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      now: () => new Date("2026-07-09T12:00:00.000Z"),
      createId: () => `loc-test-${++nextId}`,
    });

    await repository.initialize();
    const created = repository.createLocation({
      name: "North Yard",
      type: "Outdoor Area",
      description: "Outdoor staging area.",
      status: "active",
    });

    expect(created.id).toBe("loc-test-1");
    expect(repository.listLocations()).toContainEqual(created);

    const updated = repository.updateLocation(created.id, {
      name: "North Yard Updated",
      type: "Outdoor Area",
      description: "Updated description.",
      status: "inactive",
    });

    expect(updated.name).toBe("North Yard Updated");
    expect(updated.status).toBe("inactive");
    expect(get(locationRecords).find((location) => location.id === created.id)?.name).toBe(
      "North Yard Updated",
    );
  });

  it("migrates legacy records into the active lifecycle state", async () => {
    const storage = createMemoryStorage({
      "oluso.persistence.v1": JSON.stringify({
        schemaVersion: 2,
        locations: [
          {
            id: "legacy-location",
            name: "Legacy Facility",
            type: "Facility",
            description: "Imported from a previous schema.",
            status: "active",
            createdAt: "2026-07-08T12:00:00.000Z",
            updatedAt: "2026-07-08T12:00:00.000Z",
          },
        ],
        findings: [
          {
            id: "legacy-finding",
            title: "Legacy finding",
            description: "",
            locationId: "legacy-location",
            severity: "Low",
            status: "Open",
            reportedBy: "Tester",
            createdAt: "2026-07-08T12:00:00.000Z",
            updatedAt: "2026-07-08T12:00:00.000Z",
          },
        ],
        initializedAt: "2026-07-08T12:00:00.000Z",
        updatedAt: "2026-07-08T12:00:00.000Z",
      }),
    });
    const repository = createLocalPersistenceRepository({
      storage,
      now: () => new Date("2026-07-09T12:00:00.000Z"),
    });

    await repository.initialize();

    expect(repository.getRecord("locations", "legacy-location")).toMatchObject({
      archivedAt: null,
      archivedReason: null,
      lifecycleStatus: "active",
    });
    expect(get(locationRecords)[0]).toMatchObject({
      id: "legacy-location",
      lifecycleStatus: "active",
    });
  });

  it("archives and restores records while hiding archived records from default lists", async () => {
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      now: () => new Date("2026-07-09T12:00:00.000Z"),
    });

    await repository.initialize();

    const archived = repository.archiveRecord(
      "locations",
      "loc-demo-workshop",
      "Workshop decommissioned.",
    );

    expect(archived).toMatchObject({
      id: "loc-demo-workshop",
      archivedAt: "2026-07-09T12:00:00.000Z",
      archivedReason: "Workshop decommissioned.",
      lifecycleStatus: "archived",
    });
    expect(repository.listLocations().some((location) => location.id === "loc-demo-workshop")).toBe(
      false,
    );
    expect(get(locationRecords).some((location) => location.id === "loc-demo-workshop")).toBe(
      false,
    );
    expect(repository.getRecord("locations", "loc-demo-workshop")).toMatchObject({
      id: "loc-demo-workshop",
      lifecycleStatus: "archived",
    });
    expect(
      repository
        .listRegisterRecords("locations", { includeArchived: true })
        .some((location) => location.id === "loc-demo-workshop"),
    ).toBe(true);
    expect(get(locationRecords).some((location) => location.id === "loc-demo-workshop")).toBe(
      false,
    );

    const restored = repository.restoreRecord("locations", "loc-demo-workshop");

    expect(restored).toMatchObject({
      id: "loc-demo-workshop",
      archivedAt: null,
      archivedReason: null,
      lifecycleStatus: "active",
    });
    expect(repository.listLocations().some((location) => location.id === "loc-demo-workshop")).toBe(
      true,
    );
  });

  it("rejects invalid Location and Finding enum values", async () => {
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      now: () => new Date("2026-07-09T12:00:00.000Z"),
    });
    const application = createOlusoApplication(repository);

    await repository.initialize();

    expect(() =>
      application.createLocation({
        name: "Lab",
        type: "Laboratory" as LocationInput["type"],
        description: "",
        status: "active",
      }),
    ).toThrow("Type must be one of:");

    expect(() =>
      application.createFinding({
        title: "Invalid severity finding",
        type: "Inspection Finding",
        description: "",
        locationId: get(locationRecords)[0]?.id ?? "",
        processId: "",
        hazardId: "",
        severity: "Severe" as FindingInput["severity"],
        status: "Open",
        reportedBy: "Tester",
      }),
    ).toThrow("Severity is required.");

    expect(() =>
      application.createFinding({
        title: "Invalid type finding",
        type: "Walkthrough" as FindingInput["type"],
        description: "",
        locationId: get(locationRecords)[0]?.id ?? "",
        processId: "",
        hazardId: "",
        severity: "Low",
        status: "Open",
        reportedBy: "Tester",
      }),
    ).toThrow("Finding type must be one of:");

    expect(() =>
      application.createProcess({
        name: "Invalid category process",
        locationId: "",
        category: "Assembly" as ProcessInput["category"],
        description: "",
        status: "active",
      }),
    ).toThrow("Category must be one of:");

    expect(() =>
      application.createEquipment({
        name: "Invalid equipment",
        type: "Generator" as EquipmentInput["type"],
        locationId: get(locationRecords)[0]?.id ?? "",
        processId: "",
        description: "",
        status: "active",
        notes: "",
      }),
    ).toThrow("Equipment type must be one of:");

    expect(() =>
      application.createChemical({
        name: "Invalid classification chemical",
        casNumber: "",
        hazardClass: "Oxidizer" as ChemicalInput["hazardClass"],
        processIds: [],
        storageLocationId: get(locationRecords)[0]?.id ?? "",
        sdsStatus: "Missing",
        sdsReference: "",
        sdsRevisionDate: "",
        sdsReviewDate: "",
        exposureLimitValue: "",
        exposureLimitUnit: "",
        exposureLimitSource: "",
        exposureLimitAveragingPeriod: "",
        quantity: "",
        unit: "",
        supplier: "",
        status: "active",
        notes: "",
      }),
    ).toThrow("Classification must be one of:");

    expect(() =>
      application.createHazard({
        title: "Invalid category hazard",
        category: "Radiological" as HazardInput["category"],
        locationId: get(locationRecords)[0]?.id ?? "",
        locationIds: [],
        processIds: [],
        chemicalIds: [],
        severity: "Low",
        likelihood: "Rare",
        description: "",
        controls: "",
        status: "active",
      }),
    ).toThrow("Category must be one of:");

    expect(() =>
      application.createControl({
        name: "Invalid control type",
        type: "Inspection" as ControlInput["type"],
        hazardIds: [get(hazardRecords)[0]?.id ?? ""],
        description: "",
        owner: "",
        verificationMethod: "",
        verificationFrequency: "",
        lastVerifiedAt: "",
        status: "active",
        notes: "",
      }),
    ).toThrow("Control type is required.");

    expect(() =>
      application.createRiskAssessment({
        title: "Invalid review status risk assessment",
        hazardId: get(hazardRecords)[0]?.id ?? "",
        controlIds: [],
        inherentSeverity: "Medium",
        inherentLikelihood: "Possible",
        residualSeverity: "Low",
        residualLikelihood: "Unlikely",
        assessor: "",
        reviewStatus: "Complete" as RiskAssessmentInput["reviewStatus"],
        nextReviewDate: "",
        notes: "",
      }),
    ).toThrow("Review status is required.");

    expect(() =>
      application.createSeg({
        name: "Invalid type SEG",
        type: "Department" as SegInput["type"],
        description: "",
        locationId: get(locationRecords)[0]?.id ?? "",
        processId: "",
        chemicalIds: [],
        hazardIds: [],
        agentType: "Chemical",
        exposureLevel: "Low",
        workerCount: "",
        controls: "",
        monitoringFrequency: "",
        status: "active",
      }),
    ).toThrow("SEG type must be one of:");

    expect(() =>
      application.createCorrectiveAction({
        title: "Invalid action type",
        type: "Reminder" as CorrectiveActionInput["type"],
        description: "",
        findingId: get(findingRecords)[0]?.id ?? "",
        sourceType: "Finding",
        sourceId: get(findingRecords)[0]?.id ?? "",
        sourceJustification: "",
        assignedTo: "HSE Lead",
        priority: "Low",
        status: "Created",
        dueDate: "2026-07-31",
        completionSummary: "",
        verificationRequired: true,
        verificationMethod: "",
        verificationResult: "",
        evidenceReference: "",
        closureNotes: "",
      }),
    ).toThrow("Corrective action type must be one of:");
  });

  it("requires relationship-backed records to reference existing source records", async () => {
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      now: () => new Date("2026-07-09T12:00:00.000Z"),
    });
    const application = createOlusoApplication(repository);

    await repository.initialize();

    expect(() =>
      application.createFinding({
        title: "Finding without location",
        type: "Observation",
        description: "",
        locationId: "",
        processId: "",
        hazardId: "",
        severity: "Low",
        status: "Open",
        reportedBy: "Tester",
      }),
    ).toThrow("Location is required.");

    expect(() =>
      application.createCorrectiveAction({
        title: "Action without finding",
        type: "Other",
        description: "",
        findingId: "",
        sourceType: "Finding",
        sourceId: "",
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
    ).toThrow("Source record is required.");

    expect(() =>
      application.createControl({
        name: "Control without hazard",
        type: "Engineering",
        hazardIds: [],
        description: "",
        owner: "",
        verificationMethod: "",
        verificationFrequency: "",
        lastVerifiedAt: "",
        status: "active",
        notes: "",
      }),
    ).toThrow("At least one related hazard is required.");

    expect(() =>
      application.createRiskAssessment({
        title: "Risk assessment without hazard",
        hazardId: "",
        controlIds: [],
        inherentSeverity: "Medium",
        inherentLikelihood: "Possible",
        residualSeverity: "Low",
        residualLikelihood: "Unlikely",
        assessor: "",
        reviewStatus: "Draft",
        nextReviewDate: "",
        notes: "",
      }),
    ).toThrow("Related hazard is required.");
  });

  it("keeps corrective action completion, verification, and closure separate", async () => {
    let currentTime = "2026-07-09T12:00:00.000Z";
    let nextId = 0;
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      now: () => new Date(currentTime),
      createId: () => `action-test-${++nextId}`,
    });
    const application = createOlusoApplication(repository);

    await repository.initialize();

    const created = await application.createCorrectiveAction(createActionInput());

    expect(created).toMatchObject({
      id: "action-test-1",
      status: "Created",
      completedAt: null,
      verifiedAt: null,
      closedAt: null,
    });

    currentTime = "2026-07-09T12:30:00.000Z";
    const completed = await application.updateCorrectiveAction(
      created.id,
      createActionInput({
        status: "Completed",
        completionSummary: "Work was completed by maintenance.",
        verificationMethod: "Field verification",
      }),
    );

    expect(completed).toMatchObject({
      status: "Completed",
      completedAt: "2026-07-09T12:30:00.000Z",
      verifiedAt: null,
      closedAt: null,
    });

    currentTime = "2026-07-09T13:00:00.000Z";
    const verified = await application.updateCorrectiveAction(
      created.id,
      createActionInput({
        status: "Verified",
        completionSummary: "Work was completed by maintenance.",
        verificationMethod: "Field verification",
        verificationResult: "Verified acceptable.",
        evidenceReference: "Photo log IMG-1082",
      }),
    );

    expect(verified).toMatchObject({
      status: "Verified",
      completedAt: "2026-07-09T12:30:00.000Z",
      verifiedAt: "2026-07-09T13:00:00.000Z",
      closedAt: null,
      evidenceReference: "Photo log IMG-1082",
    });

    currentTime = "2026-07-09T13:30:00.000Z";
    expect(() =>
      application.updateCorrectiveAction(
        created.id,
        createActionInput({
          status: "Closed",
          completionSummary: "Work was completed by maintenance.",
          verificationMethod: "Field verification",
          verificationResult: "Verified acceptable.",
          evidenceReference: "Photo log IMG-1082",
          closureNotes: "",
        }),
      ),
    ).toThrow("Closure summary is required");

    const closed = await application.updateCorrectiveAction(
      created.id,
      createActionInput({
        status: "Closed",
        completionSummary: "Work was completed by maintenance.",
        verificationMethod: "Field verification",
        verificationResult: "Verified acceptable.",
        evidenceReference: "Photo log IMG-1082",
        closureNotes: "Closed after field verification.",
      }),
    );

    expect(closed).toMatchObject({
      status: "Closed",
      completedAt: "2026-07-09T12:30:00.000Z",
      verifiedAt: "2026-07-09T13:00:00.000Z",
      closedAt: "2026-07-09T13:30:00.000Z",
      closureNotes: "Closed after field verification.",
    });
  });

  it("supports hazard and justified manual corrective action sources", async () => {
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      now: () => new Date("2026-07-09T12:00:00.000Z"),
    });
    const application = createOlusoApplication(repository);

    await repository.initialize();

    const hazardAction = application.createCorrectiveAction(
      createActionInput({
        title: "Review slip controls",
        findingId: "",
        sourceType: "Hazard",
        sourceId: "hazard-demo-slips",
      }),
    );

    expect(hazardAction).toMatchObject({
      sourceType: "Hazard",
      sourceId: "hazard-demo-slips",
      findingId: "",
    });

    expect(() =>
      application.createCorrectiveAction(
        createActionInput({
          title: "Manual action without justification",
          findingId: "",
          sourceType: "Manual",
          sourceId: "",
          sourceJustification: "",
        }),
      ),
    ).toThrow("Manual source justification is required.");

    const manualAction = application.createCorrectiveAction(
      createActionInput({
        title: "Manual housekeeping follow-up",
        findingId: "",
        sourceType: "Manual",
        sourceId: "",
        sourceJustification: "HSE professional judgment during routine walkthrough.",
      }),
    );

    expect(manualAction).toMatchObject({
      sourceType: "Manual",
      sourceId: "",
      sourceJustification: "HSE professional judgment during routine walkthrough.",
    });
  });

  it("creates, reads, updates, and reloads Equipment", async () => {
    let nextId = 0;
    const storage = createMemoryStorage();
    const repository = createLocalPersistenceRepository({
      storage,
      now: () => new Date("2026-07-09T12:00:00.000Z"),
      createId: () => `equipment-test-${++nextId}`,
    });

    await repository.initialize();
    const locationId = get(locationRecords)[0]?.id;

    if (!locationId) {
      throw new Error("Expected seeded location");
    }

    const created = repository.createEquipment({
      name: "Mix tank local exhaust",
      type: "Ventilation",
      locationId,
      processId: "process-demo-equipment-maint",
      description: "LEV hood serving the mix tank charging area.",
      status: "active",
      notes: "HSE-relevant exposure control equipment.",
    });

    expect(created.id).toBe("equipment-test-1");
    expect(repository.listEquipment()).toContainEqual(created);

    const updated = repository.updateEquipment(created.id, {
      name: "Mix tank local exhaust",
      type: "Ventilation",
      locationId,
      processId: "",
      description: "LEV hood serving the mix tank charging area.",
      status: "under-review",
      notes: "Capture next inspection reference.",
    });

    expect(updated.status).toBe("under-review");
    expect(updated.notes).toBe("Capture next inspection reference.");

    resetPersistenceStoresForTest();

    const reloadedRepository = createLocalPersistenceRepository({
      storage,
      now: () => new Date("2026-07-09T12:30:00.000Z"),
    });
    await reloadedRepository.initialize();

    expect(reloadedRepository.listEquipment()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "equipment-test-1",
          status: "under-review",
          processId: "",
        }),
      ]),
    );
  });

  it("creates, reads, updates, and reloads Controls and Risk Assessments", async () => {
    let nextId = 0;
    const storage = createMemoryStorage();
    const repository = createLocalPersistenceRepository({
      storage,
      now: () => new Date("2026-07-09T12:00:00.000Z"),
      createId: () => `risk-test-${++nextId}`,
    });
    const application = createOlusoApplication(repository);

    await repository.initialize();
    const hazardId = get(hazardRecords)[0]?.id;

    if (!hazardId) {
      throw new Error("Expected seeded hazard");
    }

    const createdControl = await application.createControl({
      name: "Temporary guardrail",
      type: "Engineering",
      hazardIds: [hazardId],
      description: "Portable guardrail used during maintenance access.",
      owner: "Maintenance",
      verificationMethod: "Field inspection",
      verificationFrequency: "Weekly",
      lastVerifiedAt: "",
      status: "needs-review",
      notes: "",
    });

    expect(createdControl.id).toBe("risk-test-1");
    expect(repository.listControls()).toContainEqual(createdControl);

    const updatedControl = await application.updateControl(createdControl.id, {
      name: "Temporary guardrail",
      type: "Engineering",
      hazardIds: [hazardId],
      description: "Portable guardrail used during maintenance access.",
      owner: "Maintenance",
      verificationMethod: "Field inspection",
      verificationFrequency: "Weekly",
      lastVerifiedAt: "2026-07-09",
      status: "active",
      notes: "Verified in field.",
    });

    expect(updatedControl.status).toBe("active");
    expect(updatedControl.lastVerifiedAt).toBe("2026-07-09");

    const createdAssessment = await application.createRiskAssessment({
      title: "Maintenance access fall risk",
      hazardId,
      controlIds: [createdControl.id],
      inherentSeverity: "High",
      inherentLikelihood: "Possible",
      residualSeverity: "Medium",
      residualLikelihood: "Unlikely",
      assessor: "HSE Lead",
      reviewStatus: "Draft",
      nextReviewDate: "2026-10-01",
      notes: "",
    });

    expect(createdAssessment.id).toBe("risk-test-2");

    const updatedAssessment = await application.updateRiskAssessment(createdAssessment.id, {
      title: "Maintenance access fall risk",
      hazardId,
      controlIds: [createdControl.id],
      inherentSeverity: "High",
      inherentLikelihood: "Possible",
      residualSeverity: "Low",
      residualLikelihood: "Rare",
      assessor: "HSE Lead",
      reviewStatus: "Approved",
      nextReviewDate: "2026-10-01",
      notes: "Approved after guardrail verification.",
    });

    expect(updatedAssessment.reviewStatus).toBe("Approved");
    expect(updatedAssessment.residualSeverity).toBe("Low");

    resetPersistenceStoresForTest();

    const reloadedRepository = createLocalPersistenceRepository({
      storage,
      now: () => new Date("2026-07-09T12:30:00.000Z"),
    });
    await reloadedRepository.initialize();

    expect(reloadedRepository.listControls()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "risk-test-1",
          status: "active",
          lastVerifiedAt: "2026-07-09",
        }),
      ]),
    );
    expect(reloadedRepository.listRiskAssessments()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "risk-test-2",
          reviewStatus: "Approved",
          residualSeverity: "Low",
        }),
      ]),
    );
  });

  it("creates, reads, updates, and reloads a Finding", async () => {
    let nextId = 0;
    const storage = createMemoryStorage();
    const repository = createLocalPersistenceRepository({
      storage,
      now: () => new Date("2026-07-09T12:00:00.000Z"),
      createId: () => `finding-test-${++nextId}`,
    });

    await repository.initialize();
    const locationId = get(locationRecords)[0]?.id;

    if (!locationId) {
      throw new Error("Expected seeded location");
    }

    const created = repository.createFinding({
      title: "Guard missing from mixer",
      type: "Inspection Finding",
      description: "Machine guard was removed during maintenance.",
      locationId,
      processId: "",
      hazardId: "",
      severity: "Critical",
      status: "Open",
      reportedBy: "Alex",
    });

    expect(created.id).toBe("finding-test-1");
    expect(repository.listFindings()).toContainEqual(created);

    const updated = repository.updateFinding(created.id, {
      title: "Guard replaced on mixer",
      type: "Observation",
      description: "Guard has been replaced and verified.",
      locationId,
      processId: "",
      hazardId: "",
      severity: "High",
      status: "Closed",
      reportedBy: "Alex",
    });

    expect(updated.title).toBe("Guard replaced on mixer");
    expect(updated.status).toBe("Closed");

    resetPersistenceStoresForTest();

    const reloadedRepository = createLocalPersistenceRepository({
      storage,
      now: () => new Date("2026-07-09T12:30:00.000Z"),
    });

    await reloadedRepository.initialize();

    expect(get(findingRecords).some((finding) => finding.title === "Guard replaced on mixer")).toBe(
      true,
    );
  });

  it("reports invalid data path failures through diagnostics", async () => {
    const repository = createLocalPersistenceRepository({
      storage: createMemoryStorage(),
      storageKey: "",
    });

    await expect(repository.initialize()).rejects.toThrow("Persistence data path is missing.");
    expect(get(persistenceDiagnostics).status).toBe("error");
    expect(get(persistenceDiagnostics).lastError).toBe("Persistence data path is missing.");
  });
});
