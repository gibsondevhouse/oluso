import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { deleteAdamaDatabase } from "$lib/data/database";
import { FoundationApplication, type FoundationServices } from "./foundation-application";
import {
  ArchivedRelationshipError,
  CircularHierarchyError,
  CrossSiteRelationshipError,
  DuplicateBusinessIdError,
  InvalidParentTypeError,
  MissingRelationshipError,
  StaleRevisionError,
  ValidationError,
  type Location,
} from "$lib/domain/foundation";

let application: FoundationApplication;
let services: FoundationServices;
let databaseName: string;
let locationIds: string[];
let manufacturingFunctionId: string;

beforeEach(async () => {
  databaseName = `foundation-services-${crypto.randomUUID()}`;
  locationIds = [
    "country-us",
    "state-ga",
    "city-tifton",
    "site-tifton",
    "building-a",
    "unit-1",
    "state-nc",
    "city-raleigh",
    "site-raleigh",
    "building-b",
  ];
  application = new FoundationApplication({
    name: databaseName,
    identity: {
      actorId: "user-hse",
      actorBusinessId: "PER-LOCAL",
      actorDisplayName: "HSE Lead",
      installationLabel: "HSE laptop",
      datasetId: "dataset-foundation",
      installationId: "installation-hse",
      now: () => new Date("2026-07-18T20:00:00.000Z"),
    },
    createId: () => locationIds.shift()!,
  });
  services = await application.initialize();
  manufacturingFunctionId = (await services.operationalFunctions.list()).find((item) => item.name === "Manufacturing")!.id;
});

afterEach(async () => {
  application.close();
  await deleteAdamaDatabase(databaseName);
});

async function hierarchy() {
  const country = await services.locations.createCountry({ name: "United States", status: "Active" });
  const state = await services.locations.createStateOrProvince({
    name: "Georgia",
    parentId: country.id,
    status: "Active",
  });
  const city = await services.locations.createCityOrMunicipality({
    name: "Tifton",
    parentId: state.id,
    status: "Active",
  });
  const site = await services.locations.createSite({ name: "Tifton Campus", parentId: city.id, status: "Active" });
  const building = await services.locations.createOperationalNode({
    name: "Building A",
    nodeType: "Building",
    parentId: site.id,
    status: "Active",
  });
  const unit = await services.locations.createOperationalNode({
    name: "Unit 1",
    nodeType: "Unit",
    parentId: building.id,
    status: "Active",
  });
  await services.locationFunctionAssignments.create({
    locationId: unit.id, operationalFunctionId: manufacturingFunctionId,
    assignmentType: "Primary Function", isPrimary: true, status: "Active",
  });
  return { country, state, city, site, building, unit };
}

describe("typed foundation services", () => {
  it("creates a valid hierarchy and resolves every operational node to one Site", async () => {
    const { country, state, site, building, unit } = await hierarchy();
    expect(country.resolvedSiteId).toBeNull();
    expect(state.resolvedSiteId).toBeNull();
    expect(site.resolvedSiteId).toBe(site.id);
    expect(building.resolvedSiteId).toBe(site.id);
    expect(unit.resolvedSiteId).toBe(site.id);
    expect((await services.locations.breadcrumb(unit.id)).map((node) => node.name)).toEqual([
      "United States",
      "Georgia",
      "Tifton",
      "Tifton Campus",
      "Building A",
      "Unit 1",
    ]);
  });

  it("rejects invalid parents, self-parenting, descendant moves, and archived parents", async () => {
    const { country, site, building, unit } = await hierarchy();
    await expect(
      services.locations.createOperationalNode({
        name: "Invalid Unit",
        nodeType: "Unit",
        parentId: country.id,
        status: "Active",
      }),
    ).rejects.toBeInstanceOf(InvalidParentTypeError);
    await expect(services.locations.moveNode(building.id, building.id, building.revision)).rejects.toBeInstanceOf(
      CircularHierarchyError,
    );
    await expect(services.locations.moveNode(building.id, unit.id, building.revision)).rejects.toBeInstanceOf(
      CircularHierarchyError,
    );
    const archivedSite = await services.locations.archive(site.id, site.revision, "Temporarily closed");
    await expect(
      services.locations.createOperationalNode({
        name: "Building B",
        nodeType: "Building",
        parentId: archivedSite.id,
        status: "Active",
      }),
    ).rejects.toBeInstanceOf(ArchivedRelationshipError);
  });

  it("atomically recalculates descendant Site resolution after a valid move", async () => {
    const { country, building, unit } = await hierarchy();
    const process = await services.processes.create({
      name: "Packaging",
      processType: "Production",
      operationalFunctionId: manufacturingFunctionId,
      primaryLocationId: unit.id,
      status: "Active",
    });
    const task = await services.tasks.create({
      name: "Load packer",
      taskType: "Routine Operation",
      processId: process.id,
      locationId: unit.id,
      routineClassification: "Normally Routine",
      status: "Active",
    });
    const state2 = await services.locations.createStateOrProvince({
      name: "North Carolina",
      parentId: country.id,
      status: "Active",
    });
    const city2 = await services.locations.createCityOrMunicipality({
      name: "Raleigh",
      parentId: state2.id,
      status: "Active",
    });
    const site2 = await services.locations.createSite({ name: "Raleigh Campus", parentId: city2.id, status: "Active" });
    const moved = await services.locations.moveNode(building.id, site2.id, building.revision);
    const movedUnit = await services.locations.get(unit.id);
    expect(moved.resolvedSiteId).toBe(site2.id);
    expect(movedUnit.resolvedSiteId).toBe(site2.id);
    expect(movedUnit.revision).toBe(unit.revision + 1);
    expect(await services.processes.get(process.id)).toMatchObject({
      resolvedSiteId: site2.id,
      revision: process.revision + 1,
    });
    expect(await services.tasks.get(task.id)).toMatchObject({
      resolvedSiteId: site2.id,
      revision: task.revision + 1,
    });
  });

  it("rolls back a Location move that would make an active Task cross-Site", async () => {
    const { country, site, building, unit } = await hierarchy();
    const process = await services.processes.create({
      name: "Packaging",
      processType: "Production",
      operationalFunctionId: manufacturingFunctionId,
      primaryLocationId: unit.id,
      status: "Active",
    });
    await services.tasks.create({
      name: "Site-wide check",
      taskType: "Routine Operation",
      processId: process.id,
      locationId: site.id,
      routineClassification: "Normally Routine",
      status: "Active",
    });
    const state2 = await services.locations.createStateOrProvince({
      name: "North Carolina",
      parentId: country.id,
      status: "Active",
    });
    const city2 = await services.locations.createCityOrMunicipality({ name: "Raleigh", parentId: state2.id, status: "Active" });
    const site2 = await services.locations.createSite({ name: "Raleigh Campus", parentId: city2.id, status: "Active" });

    await expect(
      services.locations.moveNode(building.id, site2.id, building.revision),
    ).rejects.toBeInstanceOf(CrossSiteRelationshipError);
    expect(await services.locations.get(building.id)).toMatchObject({
      parentId: site.id,
      resolvedSiteId: site.id,
      revision: building.revision,
    });
    expect(await services.processes.get(process.id)).toMatchObject({
      resolvedSiteId: site.id,
      revision: process.revision,
    });
  });

  it("enforces Organization business IDs and Person relationships", async () => {
    const { country, site } = await hierarchy();
    const organization = await services.organizations.create({
      businessId: "ORG-1000",
      name: "Service Partner",
      organizationType: "Service Vendor",
      status: "Active",
    });
    await expect(
      services.organizations.create({
        businessId: "org-1000",
        name: "Duplicate",
        organizationType: "Other",
        status: "Active",
      }),
    ).rejects.toBeInstanceOf(DuplicateBusinessIdError);
    const person = await services.people.create({
      displayName: "Alex Rivera",
      personType: "Contractor",
      organizationId: organization.id,
      primarySiteId: site.id,
      status: "Active",
    });
    expect(person).toMatchObject({ organizationId: organization.id, primarySiteId: site.id });
    await expect(
      services.people.create({
        displayName: "Missing Org",
        personType: "Employee",
        organizationId: "missing-org",
        status: "Active",
      }),
    ).rejects.toBeInstanceOf(MissingRelationshipError);
    await expect(
      services.people.update(person.id, { ...person, supervisorPersonId: person.id }, person.revision),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      services.people.update(person.id, { ...person, primarySiteId: country.id }, person.revision),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects active people added to archived Organizations", async () => {
    const organization = await services.organizations.create({
      name: "Archived Partner",
      organizationType: "Contractor",
      status: "Active",
    });
    await services.organizations.archive(organization.id, organization.revision, "Contract ended");
    await expect(
      services.people.create({
        displayName: "New Worker",
        personType: "Contractor",
        organizationId: organization.id,
        status: "Active",
      }),
    ).rejects.toBeInstanceOf(ArchivedRelationshipError);
  });

  it("creates Site-resolved Processes and rejects unresolved or archived locations", async () => {
    const { country, unit } = await hierarchy();
    const process = await services.processes.create({
      name: "Packaging",
      processType: "Production",
      operationalFunctionId: manufacturingFunctionId,
      primaryLocationId: unit.id,
      status: "Active",
    });
    expect(process.resolvedSiteId).toBe(unit.resolvedSiteId);
    await expect(
      services.processes.create({
        name: "Invalid",
        processType: "Other",
        operationalFunctionId: manufacturingFunctionId,
        primaryLocationId: country.id,
        status: "Active",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    const archivedUnit = await services.locations.archive(unit.id, unit.revision, "Unit closed");
    await expect(
      services.processes.create({
        name: "Archived location",
        processType: "Other",
        operationalFunctionId: manufacturingFunctionId,
        primaryLocationId: archivedUnit.id,
        status: "Active",
      }),
    ).rejects.toBeInstanceOf(ArchivedRelationshipError);
  });

  it("enforces Task Process, routine-classification, archive, and same-Site rules", async () => {
    const { country, site, unit } = await hierarchy();
    const process = await services.processes.create({
      name: "Packaging",
      processType: "Production",
      operationalFunctionId: manufacturingFunctionId,
      primaryLocationId: unit.id,
      status: "Active",
    });
    const task = await services.tasks.create({
      name: "Load packer",
      taskType: "Routine Operation",
      processId: process.id,
      locationId: unit.id,
      routineClassification: "Normally Routine",
      status: "Active",
    });
    expect(task.resolvedSiteId).toBe(site.id);
    await expect(
      services.tasks.create({
        name: "Missing process",
        taskType: "Other",
        processId: "missing",
        locationId: unit.id,
        routineClassification: "Normally Non-Routine",
        status: "Active",
      }),
    ).rejects.toBeInstanceOf(MissingRelationshipError);

    const state2 = await services.locations.createStateOrProvince({
      name: "North Carolina",
      parentId: country.id,
      status: "Active",
    });
    const city2 = await services.locations.createCityOrMunicipality({ name: "Raleigh", parentId: state2.id, status: "Active" });
    const site2 = await services.locations.createSite({ name: "Raleigh Campus", parentId: city2.id, status: "Active" });
    const building2 = await services.locations.createOperationalNode({
      name: "Building B",
      nodeType: "Building",
      parentId: site2.id,
      status: "Active",
    });
    await expect(
      services.tasks.create({
        name: "Cross-site task",
        taskType: "Other",
        processId: process.id,
        locationId: building2.id,
        routineClassification: "Normally Non-Routine",
        status: "Active",
      }),
    ).rejects.toBeInstanceOf(CrossSiteRelationshipError);

    const archived = await services.processes.archive(process.id, process.revision, "Process retired");
    await expect(
      services.tasks.create({
        name: "Archived process task",
        taskType: "Other",
        processId: archived.id,
        locationId: unit.id,
        routineClassification: "Normally Non-Routine",
        status: "Active",
      }),
    ).rejects.toBeInstanceOf(ArchivedRelationshipError);
  });

  it("creates equivalent immutable revisions, increments dataset revision, and rejects stale writes", async () => {
    const organization = await services.organizations.create({
      name: "ADAMA Tifton",
      organizationType: "Corporate Group",
      status: "Active",
    });
    const updated = await services.organizations.update(
      organization.id,
      { ...organization, description: "Manufacturing site" },
      organization.revision,
    );
    const history = await application.revisionHistory<typeof updated>("Organization", organization.id);
    expect(history.map((revision) => revision.operation)).toEqual(["create", "update"]);
    expect(history.at(-1)?.after).toEqual(updated);
    expect((await application.databaseIdentity()).dataset.datasetRevision).toBe(2);
    await expect(
      services.organizations.update(
        organization.id,
        { ...updated, description: "Stale edit" },
        organization.revision,
      ),
    ).rejects.toBeInstanceOf(StaleRevisionError);
  });

  it("archives and restores through expected revisions", async () => {
    const location = await services.locations.createCountry({ name: "Canada", status: "Active" });
    const archived = await services.locations.archive(location.id, location.revision, "Duplicate geography");
    expect(archived).toMatchObject({
      lifecycleStatus: "archived",
      archivedReason: "Duplicate geography",
      revision: 2,
    });
    const restored = await services.locations.restore(archived.id, archived.revision);
    expect(restored).toMatchObject({ lifecycleStatus: "active", archivedReason: null, revision: 3 });
  });
});
