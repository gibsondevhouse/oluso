import { describe, expect, it } from "vitest";
import { buildHomeReadModel } from "./home-query-service";
import type { HomeQueryInput } from "./portal-query.types";
import { withActiveLifecycle } from "$lib/persistence/lifecycle.types";

const readyDiagnostics = {
  status: "ready" as const,
  backend: "localStorage" as const,
  connectionState: "connected" as const,
  dataPath: "localStorage://oluso.persistence.v1",
  initializedAt: "2026-07-09T00:00:00.000Z",
  lastInitializationStatus: "Local persistence initialized.",
  lastMigrationStatus: "Schema v14 is ready.",
  lastError: null,
};

function baseInput(): HomeQueryInput {
  return {
    diagnostics: readyDiagnostics,
    now: "2026-07-20T12:00:00.000Z",
    locations: [],
    processes: [],
    equipment: [],
    chemicals: [],
    hazards: [],
    controls: [],
    riskAssessments: [],
    segs: [],
    exposureMonitoring: [],
    findings: [],
    incidents: [],
    complianceItems: [],
    correctiveActions: [],
  };
}

describe("home query service", () => {
  it("prioritizes overdue corrective actions and explicit attention records", () => {
    const model = buildHomeReadModel({
      ...baseInput(),
      locations: [
        withActiveLifecycle({
          id: "loc-1",
          name: "Tifton Site",
          type: "Facility" as const,
          parentLocationId: "",
          country: "United States",
          stateProvince: "Georgia",
          description: "",
          status: "active" as const,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        }),
      ],
      correctiveActions: [
        withActiveLifecycle({
          id: "ca-1",
          title: "Verify eyewash station",
          type: "Maintenance" as const,
          description: "",
          findingId: "",
          sourceType: "Manual" as const,
          sourceId: "",
          sourceJustification: "Morning review",
          assignedTo: "HSE Officer",
          priority: "High" as const,
          status: "In Progress" as const,
          dueDate: "2026-07-19",
          completionSummary: "",
          completedAt: null,
          verificationRequired: true,
          verificationMethod: "",
          verificationResult: "",
          evidenceReference: "",
          verifiedAt: null,
          closedAt: null,
          closureNotes: "",
          createdAt: "2026-07-10T00:00:00.000Z",
          updatedAt: "2026-07-19T00:00:00.000Z",
        }),
      ],
      findings: [
        withActiveLifecycle({
          id: "finding-1",
          title: "Blocked aisle",
          type: "Inspection Finding" as const,
          description: "",
          locationId: "loc-1",
          processId: "",
          hazardId: "",
          severity: "Medium" as const,
          status: "Requires Action" as const,
          reportedBy: "HSE Officer",
          createdAt: "2026-07-18T00:00:00.000Z",
          updatedAt: "2026-07-18T00:00:00.000Z",
        }),
      ],
    });

    expect(model.context.title).toBe("Tifton Site");
    expect(model.attention[0]).toMatchObject({
      title: "Verify eyewash station",
      tone: "critical",
      href: "/actions/corrective-actions/ca-1",
      sourceState: "legacy",
    });
    expect(model.attention.map((item) => item.title)).toContain("Blocked aisle");
    expect(model.continueWork[0]?.reason).toBe("Active corrective action");
  });

  it("does not show a storage notice when local persistence is healthy", () => {
    const model = buildHomeReadModel(baseInput());

    expect(model.firstUse).toBe(true);
    expect(model.localStatusLabel).toBe("Saved locally");
    expect(model.storageNotice).toBeNull();
  });

  it("surfaces local data failures without blanking the Home model", () => {
    const model = buildHomeReadModel({
      ...baseInput(),
      diagnostics: {
        ...readyDiagnostics,
        status: "error",
        dataPath: "localStorage://oluso.persistence.v1",
        lastError: "Database unavailable",
      },
    });

    expect(model.storageNotice).toMatchObject({
      title: "Local data unavailable",
      message: "Database unavailable",
      tone: "critical",
    });
    expect(model.quickActions.length).toBeGreaterThan(0);
  });
});
