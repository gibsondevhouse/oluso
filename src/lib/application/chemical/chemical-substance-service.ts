import { ChemicalSubstanceRepository } from "$lib/data/repositories/chemical";
import {
  ChemicalDuplicateError,
  ChemicalValidationError,
  SUBSTANCE_CLASSIFICATIONS,
  SUBSTANCE_PHYSICAL_FORMS,
  assertEnum,
  dedupeStrings,
  normalizeCasNumber,
  normalizedIdentity,
  optionalText,
  requiredText,
  type ChemicalSubstance,
  type ChemicalSubstanceInput,
} from "$lib/domain/chemical";
import { ChemicalService } from "./chemical-service";

export class ChemicalSubstanceService extends ChemicalService {
  constructor(database: IDBDatabase, readonly repository = new ChemicalSubstanceRepository(database)) { super(database); }

  private normalize(input: ChemicalSubstanceInput) {
    const canonicalName = requiredText(input.canonicalName, "Canonical name");
    const synonyms = dedupeStrings(input.synonyms);
    if (synonyms.some((value) => normalizedIdentity(value) === normalizedIdentity(canonicalName))) {
      throw new ChemicalValidationError("A synonym cannot be identical to the canonical name.", {
        synonyms: "Remove the synonym that duplicates the canonical name.",
      });
    }
    const classifications = [...new Set(input.substanceClassifications ?? ["Unknown"])] as ChemicalSubstance["substanceClassifications"];
    classifications.forEach((value) => assertEnum(value, SUBSTANCE_CLASSIFICATIONS, "Substance classification"));
    return {
      canonicalName,
      casNumber: normalizeCasNumber(input.casNumber),
      synonyms,
      substanceClassifications: classifications,
      physicalForm: assertEnum(input.physicalForm, SUBSTANCE_PHYSICAL_FORMS, "Physical form"),
      description: optionalText(input.description) ?? "",
      status: input.status ?? "Active" as const,
    };
  }

  async create(input: ChemicalSubstanceInput) {
    const normalized = this.normalize(input);
    if (normalized.casNumber && await this.repository.findByCasNumber(normalized.casNumber)) {
      throw new ChemicalDuplicateError(`CAS number ${normalized.casNumber} already belongs to another Substance.`);
    }
    return this.repository.create({
      businessId: this.businessId("SUB", input.businessId), ...normalized,
    }, await this.context("Create Chemical Substance"));
  }

  async update(id: string, input: ChemicalSubstanceInput, expectedRevision: number) {
    const normalized = this.normalize(input);
    const duplicate = normalized.casNumber ? await this.repository.findByCasNumber(normalized.casNumber) : null;
    if (duplicate && duplicate.id !== id) throw new ChemicalDuplicateError(`CAS number ${normalized.casNumber} already belongs to another Substance.`);
    return this.repository.update(id, normalized, expectedRevision, await this.context("Update Chemical Substance"));
  }

  async addSynonym(id: string, synonym: string, expectedRevision: number) {
    const record = await this.repository.get(id);
    return this.update(id, {
      ...record,
      synonyms: [...record.synonyms, requiredText(synonym, "Synonym")],
    }, expectedRevision);
  }
  async removeSynonym(id: string, synonym: string, expectedRevision: number) {
    const record = await this.repository.get(id);
    return this.update(id, {
      ...record,
      synonyms: record.synonyms.filter((value) => normalizedIdentity(value) !== normalizedIdentity(synonym)),
    }, expectedRevision);
  }
  findByCasNumber(value: string) { const normalized = normalizeCasNumber(value); return normalized ? this.repository.findByCasNumber(normalized) : Promise.resolve(null); }
  archive(id: string, expectedRevision: number, reason: string) { return this.context("Archive Chemical Substance").then((context) => this.repository.archive(id, expectedRevision, reason, context)); }
  restore(id: string, expectedRevision: number) { return this.context("Restore Chemical Substance").then((context) => this.repository.restore(id, expectedRevision, context)); }
}
