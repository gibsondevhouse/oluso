import { afterEach, describe, expect, it } from "vitest";
import {
  AdamaIndexedDbAdapter,
  deleteAdamaDatabase,
  getDatabaseIdentity,
  IdentityNotInitializedError,
  initializeInstallationIdentity,
  LocalIdentityService,
  type RecordEnvelope,
} from ".";
import { RevisionRepository } from "../revisions";

interface TestOrganization extends RecordEnvelope { name: string }

const databases: IDBDatabase[] = [];
const names: string[] = [];

async function open(label: string) {
  const name = `identity-hardening-${label}-${crypto.randomUUID()}`;
  names.push(name);
  const adapter = await AdamaIndexedDbAdapter.open({ name });
  databases.push(adapter.database);
  return adapter;
}

afterEach(async () => {
  for (const database of databases.splice(0)) database.close();
  for (const name of names.splice(0)) await deleteAdamaDatabase(name);
});

describe("first-run local identity", () => {
  it("initializes a dataset and installation without inventing a production actor", async () => {
    const adapter = await open("first-run");
    expect(await adapter.identity()).toBeNull();
    expect(await adapter.localIdentity().getInstallation()).toBeTruthy();
    expect(await adapter.localIdentity().getCurrentUser()).toBeNull();
  });

  it("rejects production mutation until a named profile is configured", async () => {
    const adapter = await open("gate");
    const installation = await adapter.localIdentity().getInstallation();
    const repository = adapter.repository<TestOrganization>("organizations", {
      recordType: "Organization",
    });
    await expect(repository.create(
      { businessId: "ORG-1", name: "ADAMA" },
      {
        actorId: "local-hse-user",
        installationId: installation!.installationId,
        source: "local",
      },
    )).rejects.toBeInstanceOf(IdentityNotInitializedError);
  });

  it("persists the configured user and attributes records and revisions to its durable ID", async () => {
    const adapter = await open("persist");
    const identity = adapter.localIdentity();
    const user = await identity.configureUser({
      displayName: "Jordan Rivera",
      role: "HSE Coordinator",
      initials: "JR",
      employeeIdentifier: "E-1042",
      email: "jordan@example.com",
    }, "user-jordan");
    const context = await identity.mutationContext("Create organization");
    const repository = adapter.repository<TestOrganization>("organizations", {
      recordType: "Organization",
      createId: () => "organization-adama",
    });
    const created = await repository.create({ businessId: "ORG-ADAMA", name: "ADAMA" }, context);
    expect(created).toMatchObject({ createdBy: user.id, originInstallationId: context.installationId });
    const revisions = await new RevisionRepository(adapter.database).listForRecord(
      "Organization",
      created.id,
    );
    expect(revisions[0]).toMatchObject({
      changedBy: user.id,
      changedInstallationId: context.installationId,
    });

    const databaseName = adapter.name;
    adapter.close();
    databases.splice(databases.indexOf(adapter.database), 1);
    const reopened = await AdamaIndexedDbAdapter.open({ name: databaseName });
    databases.push(reopened.database);
    expect(await reopened.localIdentity().getCurrentUser()).toMatchObject({
      id: "user-jordan",
      displayName: "Jordan Rivera",
    });
  });

  it("allows profile edits without rewriting historical attribution", async () => {
    const adapter = await open("history");
    const identity = adapter.localIdentity();
    await identity.configureUser({
      displayName: "Jordan Rivera",
      role: "HSE Coordinator",
      initials: "JR",
    }, "user-jordan");
    const repository = adapter.repository<TestOrganization>("organizations", {
      recordType: "Organization",
      createId: () => "organization-adama",
    });
    await repository.create(
      { businessId: "ORG-ADAMA", name: "ADAMA" },
      await identity.mutationContext(),
    );
    await identity.updateUser({ displayName: "Jordan A. Rivera" });
    const revisions = await new RevisionRepository(adapter.database).listForRecord(
      "Organization",
      "organization-adama",
    );
    expect(revisions[0]?.changedBy).toBe("user-jordan");
    expect(revisions[0]?.after).toMatchObject({ createdBy: "user-jordan" });
    expect(await identity.getCurrentUser()).toMatchObject({ displayName: "Jordan A. Rivera" });
  });

  it("keeps imported identities distinct from the current installation user", async () => {
    const adapter = await open("imported");
    const identity = adapter.localIdentity();
    await identity.configureUser({
      displayName: "HSE Manager",
      role: "HSE Manager",
      initials: "HM",
    }, "manager-local");
    const transaction = adapter.database.transaction("local_users", "readwrite");
    transaction.objectStore("local_users").put({
      id: "coordinator-imported",
      businessId: "USR-COORD",
      displayName: "HSE Coordinator",
      role: "HSE Coordinator",
      initials: "HC",
      installationId: "other-installation",
      isCurrentForInstallation: true,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    expect(await identity.getCurrentUser()).toMatchObject({ id: "manager-local" });
  });

  it("reports corrupt or missing identity as recoverable and permits reconfiguration", async () => {
    const adapter = await open("recovery");
    const identity = adapter.localIdentity();
    await expect(identity.assertMutationIdentityReady()).rejects.toBeInstanceOf(
      IdentityNotInitializedError,
    );
    await identity.configureUser({
      displayName: "Alex Morgan",
      role: "Administrator",
      initials: "AM",
    });
    await expect(identity.assertMutationIdentityReady()).resolves.toBeTruthy();
  });
});
