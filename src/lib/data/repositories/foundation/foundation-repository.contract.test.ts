import { afterEach, describe, expect, it } from "vitest";
import {
  deleteAdamaDatabase,
  initializeDatabaseIdentity,
  openAdamaDatabase,
  type MutationContext,
} from "$lib/data/database";
import { RevisionRepository } from "$lib/data/revisions";
import {
  LocationRepository,
  OrganizationRepository,
  PersonRepository,
  ProcessRepository,
  TaskRepository,
} from ".";

let database: IDBDatabase | null = null;
let databaseName = "";

afterEach(async () => {
  database?.close();
  database = null;
  if (databaseName) await deleteAdamaDatabase(databaseName);
});

describe("typed foundation repository contract", () => {
  it("persists and retrieves every entity through its dedicated IndexedDB repository", async () => {
    databaseName = `foundation-repository-contract-${crypto.randomUUID()}`;
    database = await openAdamaDatabase({ name: databaseName });
    await initializeDatabaseIdentity(database, {
      actorId: "repository-user",
      actorBusinessId: "PER-REPOSITORY",
      actorDisplayName: "Repository User",
      installationLabel: "Repository test",
      datasetId: "dataset-repository-test",
      installationId: "installation-repository-test",
    });
    const context: MutationContext = {
      actorId: "repository-user",
      installationId: "installation-repository-test",
      source: "local",
    };
    const organizations = new OrganizationRepository(database);
    const people = new PersonRepository(database);
    const locations = new LocationRepository(database);
    const processes = new ProcessRepository(database);
    const tasks = new TaskRepository(database);

    const organization = await organizations.create({
      businessId: "ORG-0001",
      name: "ADAMA",
      organizationType: "ADAMA Entity",
      status: "Active",
      description: "",
      primaryContactPersonId: null,
    }, context);
    const person = await people.create({
      businessId: "PER-0001",
      displayName: "HSE Lead",
      personType: "Employee",
      organizationId: organization.id,
      employeeIdentifier: "",
      jobTitle: "HSE Lead",
      department: "HSE",
      supervisorPersonId: null,
      primarySiteId: null,
      email: "",
      phone: "",
      description: "",
      status: "Active",
    }, context);
    const location = await locations.create({
      businessId: "LOC-0001",
      name: "United States",
      nodeType: "Country",
      parentId: null,
      resolvedSiteId: null,
      description: "",
      status: "Active",
    }, context);
    const process = await processes.create({
      businessId: "PROC-0001",
      name: "Packaging",
      processType: "Production",
      primaryLocationId: location.id,
      resolvedSiteId: location.id,
      description: "",
      status: "Active",
    }, context);
    const task = await tasks.create({
      businessId: "TASK-0001",
      name: "Load packer",
      taskType: "Routine Operation",
      processId: process.id,
      locationId: location.id,
      resolvedSiteId: location.id,
      description: "",
      routineStatus: "Routine",
      operatingCondition: "Routine",
      status: "Active",
    }, context);

    expect(await organizations.get(organization.id)).toEqual(organization);
    expect(await people.listByOrganization(organization.id)).toEqual([person]);
    expect(await locations.list()).toEqual([location]);
    expect(await processes.listByLocation(location.id)).toEqual([process]);
    expect(await tasks.listByProcess(process.id)).toEqual([task]);

    const archived = await organizations.archive(organization.id, organization.revision, "Superseded", context);
    expect(await organizations.list()).toEqual([]);
    expect((await organizations.restore(archived.id, archived.revision, context)).lifecycleStatus).toBe("active");
    expect(await new RevisionRepository(database).listForRecord("Organization", organization.id)).toHaveLength(3);
  });
});
