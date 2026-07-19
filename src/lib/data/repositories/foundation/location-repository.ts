import { runMutationTransaction } from "$lib/data/revisions";
import type { MutationContext } from "$lib/data/database";
import type { Location, Process, Task } from "$lib/domain/foundation";
import type { ListRecordOptions } from "../record-repository";
import { FoundationRepository } from "./foundation-repository";

export interface LocationMutation {
  record: Location;
  patch: Partial<Omit<Location, keyof import("$lib/data/database").RecordEnvelope>>;
  expectedRevision?: number;
}

export interface ProcessSiteMutation {
  record: Process;
  resolvedSiteId: string;
}

export interface TaskSiteMutation {
  record: Task;
  resolvedSiteId: string;
}

export class LocationRepository extends FoundationRepository<Location> {
  constructor(database: IDBDatabase) {
    super(database, "locations", "Location");
  }

  listChildren(parentId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byParent", parentId, options);
  }

  listByResolvedSite(siteId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byResolvedSite", siteId, options);
  }

  async createWithId(
    id: string,
    input: Omit<Location, keyof import("$lib/data/database").RecordEnvelope> & { businessId: string },
    context: MutationContext,
  ) {
    try {
      return await runMutationTransaction(
        this.database,
        ["locations"],
        context,
        (session) =>
          session.createRecord<Location, typeof input>({
            id,
            storeName: "locations",
            recordType: "Location",
            input,
          }),
      );
    } catch (error) {
      throw this.translate(error);
    }
  }

  async listDescendants(parentId: string, options: ListRecordOptions = {}) {
    const descendants: Location[] = [];
    const pending = [...(await this.listChildren(parentId, options))];
    while (pending.length > 0) {
      const location = pending.shift()!;
      descendants.push(location);
      pending.push(...(await this.listChildren(location.id, options)));
    }
    return descendants;
  }

  async updateHierarchy(
    mutations: LocationMutation[],
    processMutations: ProcessSiteMutation[],
    taskMutations: TaskSiteMutation[],
    context: MutationContext,
  ) {
    try {
      return await runMutationTransaction(
        this.database,
        ["locations", "processes", "tasks"],
        context,
        async (session) => {
          const changed: Location[] = [];
          for (const mutation of mutations) {
            changed.push(
              await session.updateRecord<Location, LocationMutation["patch"]>({
                storeName: "locations",
                recordType: "Location",
                id: mutation.record.id,
                expectedRevision: mutation.expectedRevision ?? mutation.record.revision,
                patch: mutation.patch,
              }),
            );
          }
          for (const mutation of processMutations) {
            await session.updateRecord<Process, Pick<Process, "resolvedSiteId">>({
              storeName: "processes",
              recordType: "Process",
              id: mutation.record.id,
              expectedRevision: mutation.record.revision,
              patch: { resolvedSiteId: mutation.resolvedSiteId },
            });
          }
          for (const mutation of taskMutations) {
            await session.updateRecord<Task, Pick<Task, "resolvedSiteId">>({
              storeName: "tasks",
              recordType: "Task",
              id: mutation.record.id,
              expectedRevision: mutation.record.revision,
              patch: { resolvedSiteId: mutation.resolvedSiteId },
            });
          }
          return changed;
        },
      );
    } catch (error) {
      throw this.translate(error);
    }
  }
}
