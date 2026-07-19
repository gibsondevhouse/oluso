import { OperationalFunctionRepository } from "$lib/data/repositories/operations";
import { OPERATIONAL_FUNCTION_CATEGORIES, type OperationalFunction, type OperationalFunctionFields } from "$lib/domain/operations";
import { FOUNDATION_RECORD_STATUSES, ValidationError } from "$lib/domain/foundation";
import { FoundationService, type FoundationServiceOptions } from "../foundation/foundation-service";

export class OperationalFunctionService extends FoundationService<OperationalFunction> {
  constructor(repository: OperationalFunctionRepository, options: FoundationServiceOptions) {
    super(repository, "FUNC", "OperationalFunction", options);
  }
  async create(input: OperationalFunctionFields) {
    const normalized = await this.normalize(input);
    return this.repository.create({ businessId: await this.businessId(input.businessId), ...normalized }, this.options.context());
  }
  async update(id: string, input: OperationalFunctionFields, expectedRevision: number) {
    const current = await this.requireMutable(id);
    return this.repository.update(id, await this.normalize({ ...current, ...input }, id), expectedRevision, this.options.context());
  }
  private async normalize(input: OperationalFunctionFields, currentId?: string) {
    if (!input.name?.trim() || !OPERATIONAL_FUNCTION_CATEGORIES.includes(input.functionCategory) || !FOUNDATION_RECORD_STATUSES.includes(input.status)) {
      throw new ValidationError([{ field: "name", message: "Function name, category, and status are required.", code: "REQUIRED" }]);
    }
    const duplicate = await (this.repository as OperationalFunctionRepository).findByName(input.name, { includeArchived: true });
    if (duplicate && duplicate.id !== currentId) {
      throw new ValidationError([{ field: "name", message: "Operational Function names must be reusable global identities, not duplicated per Site.", code: "DUPLICATE_FUNCTION" }]);
    }
    return { name: input.name.trim(), functionCategory: input.functionCategory, description: input.description?.trim() ?? "", status: input.status };
  }
  protected title(record: OperationalFunction) { return record.name; }
}
