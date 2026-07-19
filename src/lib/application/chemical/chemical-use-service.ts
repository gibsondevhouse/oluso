import { ChemicalProductRepository, ChemicalUseRepository } from "$lib/data/repositories/chemical";
import {
  APPLICATION_METHODS, CHEMICAL_OPERATING_CONDITIONS, CHEMICAL_USE_FREQUENCIES, DURATION_UNITS, QUANTITY_SCALES,
  ChemicalRelationshipError, ChemicalValidationError,
  assertEnum, dedupeStrings, optionalNonNegative, optionalText,
  type ChemicalUseInput,
} from "$lib/domain/chemical";
import type { FoundationLocation } from "$lib/domain/foundation";
import { ChemicalService, type FoundationProcess, type FoundationTask } from "./chemical-service";

export class ChemicalUseService extends ChemicalService {
  constructor(
    database: IDBDatabase,
    readonly repository = new ChemicalUseRepository(database),
    private readonly products = new ChemicalProductRepository(database),
  ) { super(database); }

  private async normalize(input: ChemicalUseInput) {
    await this.requireRecord(this.products, input.productId, "Product", true);
    const site = await this.getFoundation<FoundationLocation>("locations", input.siteId, "Site");
    if (site.nodeType !== "Site") throw new ChemicalRelationshipError("Selected Site must be a Site Location.");
    const location = await this.getFoundation<FoundationLocation>("locations", input.locationId, "Location");
    if (location.id !== site.id && location.resolvedSiteId !== site.id) throw new ChemicalRelationshipError("Location does not resolve to the selected Site.");
    const process = await this.getFoundation<FoundationProcess>("processes", input.processId, "Process");
    if (process.resolvedSiteId !== site.id) throw new ChemicalRelationshipError("Process does not resolve to the selected Site.");
    const taskId = optionalText(input.taskId);
    if (taskId) {
      const task = await this.getFoundation<FoundationTask>("tasks", taskId, "Task");
      if (task.processId !== process.id) throw new ChemicalRelationshipError("Task does not belong to the selected Process.");
      if (task.resolvedSiteId !== site.id) throw new ChemicalRelationshipError("Task does not resolve to the selected Site.");
    }
    const evidenceReferenceIds = dedupeStrings(input.evidenceReferenceIds);
    for (const id of evidenceReferenceIds) await this.getFoundation("evidence_references", id, "Evidence Reference");
    const controlIds = dedupeStrings(input.controlIds);
    for (const id of controlIds) await this.getFoundation("controls", id, "Control");
    const duration = optionalNonNegative(input.duration, "Duration");
    const durationUnit = assertEnum(input.durationUnit, DURATION_UNITS, "Duration unit");
    if (duration !== undefined && durationUnit === "Unknown") throw new ChemicalValidationError("Select a duration unit when duration is supplied.");
    return {
      productId: input.productId, siteId: site.id, locationId: location.id, processId: process.id, taskId,
      operatingCondition: assertEnum(input.operatingCondition, CHEMICAL_OPERATING_CONDITIONS, "Operating condition"),
      frequency: assertEnum(input.frequency, CHEMICAL_USE_FREQUENCIES, "Frequency"), duration, durationUnit,
      quantityScale: assertEnum(input.quantityScale, QUANTITY_SCALES, "Quantity scale"),
      applicationMethod: assertEnum(input.applicationMethod, APPLICATION_METHODS, "Application method"),
      controlIds, deferredControlNotes: optionalText(input.deferredControlNotes) ?? "", evidenceReferenceIds,
      status: input.status ?? "Active" as const, notes: optionalText(input.notes) ?? "",
    };
  }
  async create(input: ChemicalUseInput) { return this.repository.create({ businessId: this.businessId("USE", input.businessId), ...await this.normalize(input) }, await this.context("Create Chemical Use")); }
  async update(id: string, input: ChemicalUseInput, expectedRevision: number) { return this.repository.update(id, await this.normalize(input), expectedRevision, await this.context("Update Chemical Use")); }
  async changeSite(id: string, siteId: string, locationId: string, processId: string, taskId: string | undefined, expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, siteId, locationId, processId, taskId }, expectedRevision); }
  async changeLocation(id: string, locationId: string, expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, locationId }, expectedRevision); }
  async changeProcess(id: string, processId: string, taskId: string | undefined, expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, processId, taskId }, expectedRevision); }
  async changeTask(id: string, taskId: string | undefined, expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, taskId }, expectedRevision); }
  async changeOperatingCondition(id: string, operatingCondition: ChemicalUseInput["operatingCondition"], expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, operatingCondition }, expectedRevision); }
  async linkEvidence(id: string, evidenceId: string, expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, evidenceReferenceIds: [...record.evidenceReferenceIds, evidenceId] }, expectedRevision); }
  async unlinkEvidence(id: string, evidenceId: string, expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, evidenceReferenceIds: record.evidenceReferenceIds.filter((value) => value !== evidenceId) }, expectedRevision); }
  listByProduct(id: string) { return this.repository.listByProduct(id); }
  listBySite(id: string) { return this.repository.listBySite(id); }
  listByProcess(id: string) { return this.repository.listByProcess(id); }
  listByTask(id: string) { return this.repository.listByTask(id); }
  archive(id: string, expectedRevision: number, reason: string) { return this.context("Archive Chemical Use").then((context) => this.repository.archive(id, expectedRevision, reason, context)); }
  restore(id: string, expectedRevision: number) { return this.context("Restore Chemical Use").then((context) => this.repository.restore(id, expectedRevision, context)); }
}
