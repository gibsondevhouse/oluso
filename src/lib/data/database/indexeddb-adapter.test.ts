import { afterEach, describe, expect, it } from "vitest";
import { getBackupStatus } from "../backup/index";
import { requestToPromise, transactionToPromise } from "./idb-utils";
import {
  AdamaIndexedDbAdapter,
  deleteAdamaDatabase,
  type MutationContext,
  type RecordEnvelope,
} from ".";

interface TestOrganization extends RecordEnvelope {
  name: string;
  organizationType: string;
}

const openAdapters: AdamaIndexedDbAdapter[] = [];
const databaseNames: string[] = [];

function name(label: string) {
  const databaseName = `adama-hse-adapter-${label}-${crypto.randomUUID()}`;
  databaseNames.push(databaseName);
  return databaseName;
}

async function open(label: string) {
  const adapter = await AdamaIndexedDbAdapter.open({
    name: name(label),
    identity: {
      actorId: "user-hse",
      actorBusinessId: "PER-LOCAL",
      actorDisplayName: "HSE Lead",
      installationLabel: "HSE laptop",
      datasetId: "dataset-adapter-test",
      installationId: "installation-hse",
      now: () => new Date("2026-07-18T18:00:00.000Z"),
    },
  });
  openAdapters.push(adapter);
  return adapter;
}

const context: MutationContext = {
  actorId: "user-hse",
  installationId: "installation-hse",
  source: "local",
  reason: "Adapter contract test",
};

afterEach(async () => {
  for (const adapter of openAdapters.splice(0)) adapter.close();
  for (const databaseName of databaseNames.splice(0)) await deleteAdamaDatabase(databaseName);
});

describe("AdamaIndexedDbAdapter", () => {
  it("manages open/close lifecycle and persists repository state across browser restarts", async () => {
    const adapter = await open("restart");
    const repository = adapter.repository<TestOrganization>("organizations", {
      recordType: "Organization",
      createId: () => "organization-adama",
    });
    await repository.create(
      {
        businessId: "ORG-ADAMA",
        name: "ADAMA US",
        organizationType: "OperatingCompany",
      },
      context,
    );
    const databaseName = adapter.name;
    adapter.close();

    const reopened = await AdamaIndexedDbAdapter.open({ name: databaseName });
    openAdapters.push(reopened);
    expect(
      await reopened.repository<TestOrganization>("organizations", {
        recordType: "Organization",
      }).list(),
    ).toEqual([expect.objectContaining({ id: "organization-adama", revision: 1 })]);
    expect((await reopened.identity())?.dataset.datasetId).toBe("dataset-adapter-test");
    expect((await reopened.inspectIntegrity()).status).toBe("healthy");
  });

  it("detects current-state corruption without modifying the database", async () => {
    const adapter = await open("integrity");
    const repository = adapter.repository<TestOrganization>("organizations", {
      recordType: "Organization",
      createId: () => "organization-adama",
    });
    const organization = await repository.create(
      {
        businessId: "ORG-ADAMA",
        name: "ADAMA US",
        organizationType: "OperatingCompany",
      },
      context,
    );

    const transaction = adapter.database.transaction("organizations", "readwrite");
    const completion = transactionToPromise(transaction);
    await requestToPromise(
      transaction.objectStore("organizations").put({ ...organization, name: "Untracked edit" }),
    );
    await completion;

    const report = await adapter.inspectIntegrity();
    expect(report.status).toBe("corrupt");
    expect(report.findings).toEqual([
      expect.objectContaining({
        code: "REVISION_STATE_MISMATCH",
        storeName: "organizations",
        recordId: "organization-adama",
      }),
    ]);
    await expect(adapter.assertIntegrity()).rejects.toMatchObject({
      code: "DATABASE_INTEGRITY_FAILED",
    });
  });

  it("prompts from verified backup age and dataset revision instead of a timer", async () => {
    const adapter = await open("backup-status");
    const repository = adapter.repository<TestOrganization>("organizations", {
      recordType: "Organization",
      createId: () => "organization-adama",
    });
    await repository.create(
      {
        businessId: "ORG-ADAMA",
        name: "ADAMA US",
        organizationType: "OperatingCompany",
      },
      context,
    );
    expect(await adapter.backupStatus()).toMatchObject({ status: "never" });

    const backup = await adapter.exportBackup();
    await adapter.recordVerifiedBackup(backup);
    expect(await adapter.backupStatus()).toMatchObject({ status: "current" });

    const current = await repository.get("organization-adama");
    await repository.update(current.id, { name: "ADAMA Agricultural Solutions" }, 1, context);
    expect(
      await getBackupStatus(adapter.database, {
        maxRevisionDelta: 1,
        now: new Date(backup.createdAt),
      }),
    ).toMatchObject({ status: "due", revisionsSinceBackup: 1 });
  });
});
