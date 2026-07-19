import { describe, expect, it } from "vitest";
import {
  issuesByField,
  validateLocation,
  validateOrganization,
  validatePerson,
  validateProcess,
  validateTask,
} from ".";

describe("foundation domain validation", () => {
  it("returns field-specific organization and person issues without UI dependencies", () => {
    expect(
      issuesByField(validateOrganization({ name: "", organizationType: "Other", status: "Active" })),
    ).toEqual({ name: "Name is required." });
    expect(
      issuesByField(validatePerson({
        displayName: "",
        personType: "Employee",
        status: "Active",
        email: "not-an-email",
      })),
    ).toMatchObject({
      displayName: "Display name is required.",
      email: "Enter a valid email address.",
    });
  });

  it("validates hierarchy fields, process location, and task operating condition", () => {
    expect(
      issuesByField(validateLocation({ name: "Site", nodeType: "Site", status: "Active" })),
    ).toHaveProperty("parentId");
    expect(
      issuesByField(validateProcess({
        name: "Packaging",
        processType: "Production",
        primaryLocationId: "",
        status: "Active",
      })),
    ).toHaveProperty("primaryLocationId");
    expect(
      issuesByField(validateTask({
        name: "Load line",
        taskType: "Routine Operation",
        processId: "process-1",
        locationId: "location-1",
        routineStatus: "Routine",
        operatingCondition: "" as never,
        status: "Active",
      })),
    ).toHaveProperty("operatingCondition");
  });
});
