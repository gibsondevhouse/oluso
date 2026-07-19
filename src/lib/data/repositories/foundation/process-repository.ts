import type { Process } from "$lib/domain/foundation";
import type { MutationContext } from "$lib/data/database";
import { runMutationTransaction } from "$lib/data/revisions";
import type { ProcessLocationAssignment } from "$lib/domain/operations";
import type { ListRecordOptions } from "../record-repository";
import { FoundationRepository } from "./foundation-repository";

export class ProcessRepository extends FoundationRepository<Process> {
  constructor(database: IDBDatabase) {
    super(database, "processes", "Process");
  }

  listByLocation(locationId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byPrimaryLocation", locationId, options);
  }

  listByResolvedSite(siteId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byResolvedSite", siteId, options);
  }

  listByOperationalFunction(operationalFunctionId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byOperationalFunction", operationalFunctionId, options);
  }

  async createWithPrimaryAssignment(
    processInput: Omit<Process, keyof import("$lib/data/database").RecordEnvelope> & { businessId: string },
    assignmentInput: Omit<ProcessLocationAssignment, keyof import("$lib/data/database").RecordEnvelope> & { businessId: string },
    context: MutationContext,
  ) {
    try {
      return await runMutationTransaction(
        this.database,
        ["processes", "process_location_assignments"],
        context,
        async (session) => {
          const process = await session.createRecord<Process, typeof processInput>({
            storeName: "processes", recordType: "Process", input: processInput,
          });
          await session.createRecord<ProcessLocationAssignment, typeof assignmentInput>({
            storeName: "process_location_assignments", recordType: "ProcessLocationAssignment", input: { ...assignmentInput, processId: process.id },
          });
          return process;
        },
      );
    } catch (error) {
      throw this.translate(error);
    }
  }

  async updateWithPrimaryAssignment(
    process: Process,
    processPatch: Partial<Omit<Process, keyof import("$lib/data/database").RecordEnvelope>>,
    expectedRevision: number,
    assignment: ProcessLocationAssignment,
    assignmentPatch: Partial<Omit<ProcessLocationAssignment, keyof import("$lib/data/database").RecordEnvelope>>,
    context: MutationContext,
  ) {
    try {
      return await runMutationTransaction(
        this.database,
        ["processes", "process_location_assignments"],
        context,
        async (session) => {
          const updated = await session.updateRecord<Process, typeof processPatch>({
            storeName: "processes", recordType: "Process", id: process.id, expectedRevision, patch: processPatch,
          });
          await session.updateRecord<ProcessLocationAssignment, typeof assignmentPatch>({
            storeName: "process_location_assignments", recordType: "ProcessLocationAssignment",
            id: assignment.id, expectedRevision: assignment.revision, patch: assignmentPatch,
          });
          return updated;
        },
      );
    } catch (error) {
      throw this.translate(error);
    }
  }
}
