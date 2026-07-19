import type { MutableRecordStoreName } from "../database/schema";
import type { MutationContext, RecordEnvelope } from "../database/types";
import { runMutationTransaction } from "../revisions/mutation-transaction";
import { detectLegacySource, type DetectedLegacySource } from "./legacy-source";
import { LEGACY_COLLECTION_MAPPING } from "./legacy-mapping";
import { normalizeCasNumber } from "$lib/domain/chemical";
import { requestToPromise, transactionToPromise } from "../database/idb-utils";
import { AdamaDatabaseError } from "../database/errors";

type SourceRecord = Record<string, unknown>;
type MigratedRecord = RecordEnvelope & Record<string, unknown>;

export interface LegacyMigrationOptions {
  actorId: string;
  installationId: string;
  now?: () => Date;
  migrationRunId?: string;
}

export interface LegacyMigrationResult {
  migrationRunId: string;
  sourceKind: DetectedLegacySource["kind"];
  sourceSchemaVersion: number;
  importedRecordCount: number;
  dataQualityFindingCount: number;
  deferredRecordCount: number;
  countsByStore: Record<string, number>;
  alreadyApplied?: boolean;
}

interface PreparedMigration {
  records: Map<MutableRecordStoreName, MigratedRecord[]>;
  deferredRecords: Array<{ collection: string; record: SourceRecord }>;
  dataQualityFindings: MigratedRecord[];
  chemicalMappings: Array<{
    sourceRecordId: string;
    productId: string;
    substanceId?: string;
    sdsRevisionId?: string;
    inventoryId?: string;
    chemicalUseIds: string[];
  }>;
}

interface ExistingChemicalIdentity {
  substances: MigratedRecord[];
  products: MigratedRecord[];
  compositions: MigratedRecord[];
}

interface AppliedMigrationRun {
  id: string;
  status: string;
  sourceKind: DetectedLegacySource["kind"];
  sourceSchemaVersion: number;
  sourceFingerprint: DetectedLegacySource["fingerprint"];
  importedRecordCount: number;
  dataQualityFindingCount?: number;
  deferredRecordCount: number;
  countsByStore: Record<string, number>;
}

const LEGACY_LOCATION_TYPE_MAP: Record<string, string> = {
  Facility: "Site",
  "Production Area": "Unit",
  Storage: "StorageArea",
  Lab: "Room",
  Office: "Room",
  "Utility Area": "Zone",
  "Outdoor Area": "OutdoorArea",
};

function isRecord(value: unknown): value is SourceRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function fingerprintsMatch(
  stored: unknown,
  current: DetectedLegacySource["fingerprint"],
) {
  if (!isRecord(stored)) return false;
  if (typeof stored.contentHash === "string") return stored.contentHash === current.contentHash;
  const { contentHash: _contentHash, ...structuralFingerprint } = current;
  return JSON.stringify(stored) === JSON.stringify(structuralFingerprint);
}

function records(source: DetectedLegacySource, collection: string) {
  const value = source.database[collection];
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function slug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "unknown";
}

function iso(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? fallback : parsed.toISOString();
}

function legacyLifecycle(record: SourceRecord) {
  return text(record.lifecycleStatus).toLowerCase() === "archived" ? "archived" : "active";
}

function envelope(
  record: SourceRecord,
  options: LegacyMigrationOptions,
  timestamp: string,
  sourceInstallationId: string,
  overrides: Partial<RecordEnvelope> = {},
): RecordEnvelope {
  const lifecycleStatus = legacyLifecycle(record);
  const createdAt = iso(record.createdAt, timestamp);
  const updatedAt = iso(record.updatedAt, createdAt);
  return {
    id: text(record.id),
    businessId: text(record.businessId),
    revision: 1,
    createdAt,
    createdBy: options.actorId,
    updatedAt,
    updatedBy: options.actorId,
    originInstallationId: sourceInstallationId,
    lastExchangePackageId: undefined,
    lifecycleStatus,
    archivedAt: lifecycleStatus === "archived" ? iso(record.archivedAt, updatedAt) : null,
    archivedBy: lifecycleStatus === "archived" ? options.actorId : null,
    archiveReason:
      lifecycleStatus === "archived"
        ? text(record.archiveReason, text(record.archivedReason, "Migrated archive"))
        : null,
    ...overrides,
  };
}

function addRecord(
  output: PreparedMigration,
  storeName: MutableRecordStoreName,
  record: MigratedRecord,
) {
  const storeRecords = output.records.get(storeName) ?? [];
  storeRecords.push(record);
  output.records.set(storeName, storeRecords);
}

function businessId(prefix: string, id: string) {
  return `MIG-${prefix}-${slug(id).toUpperCase()}`;
}

function directRecord(
  record: SourceRecord,
  options: LegacyMigrationOptions,
  timestamp: string,
  sourceInstallationId: string,
  prefix: string,
  additional: SourceRecord = {},
): MigratedRecord {
  const id = text(record.id);
  return {
    ...record,
    ...additional,
    ...envelope(record, options, timestamp, sourceInstallationId, {
      id,
      businessId: text(record.businessId).trim() || businessId(prefix, id),
    }),
  };
}

function deterministicDerivedRecord(
  source: SourceRecord,
  suffix: string,
  prefix: string,
  options: LegacyMigrationOptions,
  timestamp: string,
  sourceInstallationId: string,
  data: SourceRecord,
): MigratedRecord {
  const sourceId = text(source.id);
  const id = `${sourceId}:${suffix}`;
  return {
    ...data,
    ...envelope(source, options, timestamp, sourceInstallationId, {
      id,
      businessId: businessId(prefix, id),
    }),
  };
}

function prepareLocations(
  source: DetectedLegacySource,
  output: PreparedMigration,
  options: LegacyMigrationOptions,
  timestamp: string,
  sourceInstallationId: string,
) {
  const sourceLocations = records(source, "locations");
  const byId = new Map(sourceLocations.map((record) => [text(record.id), record]));
  const siteFor = new Map<string, string>();
  const resolving = new Set<string>();
  const resolveSite = (record: SourceRecord): string => {
    const id = text(record.id);
    if (siteFor.has(id)) return siteFor.get(id)!;
    if (resolving.has(id)) return "";
    resolving.add(id);
    const parentId = text(record.parentLocationId);
    const nodeType = LEGACY_LOCATION_TYPE_MAP[text(record.type)] ?? "Zone";
    const resolved = nodeType === "Site" ? id : parentId && byId.has(parentId) ? resolveSite(byId.get(parentId)!) : "";
    resolving.delete(id);
    siteFor.set(id, resolved);
    return resolved;
  };

  const geography = new Map<string, { countryId: string; stateId: string }>();
  const countryIds = new Set<string>();
  for (const record of sourceLocations) {
    const nodeType = LEGACY_LOCATION_TYPE_MAP[text(record.type)] ?? "Zone";
    if (nodeType !== "Site") continue;
    const country = text(record.country, "Unknown country");
    const state = text(record.stateProvince, "Unknown region");
    const key = `${country}\u0000${state}`;
    if (geography.has(key)) continue;
    const countryId = `legacy-geography:country:${slug(country)}`;
    const stateId = `legacy-geography:state:${slug(country)}:${slug(state)}`;
    if (!countryIds.has(countryId)) {
      addRecord(output, "locations", deterministicDerivedRecord(record, `country:${slug(country)}`, "LOC", options, timestamp, sourceInstallationId, {
        id: countryId,
        name: country,
        nodeType: "Country",
        parentId: null,
        resolvedSiteId: null,
      }));
      const countryRecord = output.records.get("locations")!.at(-1)!;
      countryRecord.id = countryId;
      countryRecord.businessId = businessId("LOC", countryId);
      countryIds.add(countryId);
    }
    addRecord(output, "locations", deterministicDerivedRecord(record, `state:${slug(country)}:${slug(state)}`, "LOC", options, timestamp, sourceInstallationId, {
      id: stateId,
      name: state,
      nodeType: "StateOrRegion",
      parentId: countryId,
      resolvedSiteId: null,
    }));
    const stateRecord = output.records.get("locations")!.at(-1)!;
    stateRecord.id = stateId;
    stateRecord.businessId = businessId("LOC", stateId);
    geography.set(key, { countryId, stateId });
  }

  for (const record of sourceLocations) {
    const id = text(record.id);
    const nodeType = LEGACY_LOCATION_TYPE_MAP[text(record.type)] ?? "Zone";
    let parentId: string | null = text(record.parentLocationId) || null;
    if (nodeType === "Site") {
      const key = `${text(record.country, "Unknown country")}\u0000${text(record.stateProvince, "Unknown region")}`;
      parentId = geography.get(key)?.stateId ?? null;
    }
    addRecord(output, "locations", directRecord(record, options, timestamp, sourceInstallationId, "LOC", {
      name: text(record.name, text(record.title)),
      nodeType,
      parentId,
      resolvedSiteId: nodeType === "Site" ? id : resolveSite(record) || null,
      legacyLocationType: text(record.type),
    }));
  }
}

function createFinding(
  output: PreparedMigration,
  sourceRecord: SourceRecord,
  collection: string,
  code: string,
  message: string,
  options: LegacyMigrationOptions,
  timestamp: string,
  sourceInstallationId: string,
) {
  const id = `migration-finding:${collection}:${text(sourceRecord.id, slug(message))}:${code}`;
  const finding = directRecord(
    { id, createdAt: sourceRecord.createdAt, updatedAt: sourceRecord.updatedAt },
    options,
    timestamp,
    sourceInstallationId,
    "DQF",
    {
      title: message,
      code,
      findingCode: code,
      summary: message,
      details: message,
      recommendedResolution: "Review the preserved source evidence and confirm or correct the canonical mapping.",
      severity: "Moderate",
      status: "Open",
      recordType: collection,
      recordId: text(sourceRecord.id),
      sourceRecordType: collection,
      sourceRecordId: text(sourceRecord.id),
      sourceCollection: collection,
      sourceEvidence: structuredClone(sourceRecord),
    },
  );
  output.dataQualityFindings.push(finding);
  addRecord(output, "data_quality_findings", finding);
}

function prepareMigration(
  source: DetectedLegacySource,
  options: LegacyMigrationOptions,
  timestamp: string,
  existingChemicalIdentity: ExistingChemicalIdentity = { substances: [], products: [], compositions: [] },
): PreparedMigration {
  const sourceInstallationId = `legacy:${source.kind}:${source.schemaVersion}`;
  const output: PreparedMigration = {
    records: new Map(),
    deferredRecords: [],
    dataQualityFindings: [],
    chemicalMappings: [],
  };
  prepareLocations(source, output, options, timestamp, sourceInstallationId);

  const siteByLocation = new Map<string, string>();
  for (const location of output.records.get("locations") ?? []) {
    const siteId = text(location.resolvedSiteId);
    if (siteId) siteByLocation.set(location.id, siteId);
    if (location.nodeType === "Site") siteByLocation.set(location.id, location.id);
  }

  const directMappings: Array<[string, MutableRecordStoreName, string]> = [
    ["organizations", "organizations", "ORG"],
    ["people", "people", "PER"],
    ["hazards", "hazards", "HAZ"],
    ["controls", "controls", "CTL"],
    ["segs", "segs", "SEG"],
    ["findings", "findings", "FND"],
    ["incidents", "incidents", "INC"],
    ["correctiveActions", "corrective_actions", "ACT"],
    ["documentReferences", "document_references", "DOC"],
    ["exposureAgents", "exposure_agents", "AGT"],
    ["exposureLimits", "exposure_limits", "OEL"],
    ["segMemberships", "seg_memberships", "SEGM"],
    ["inspections", "inspections", "INSP"],
    ["controlVerifications", "control_verifications", "CV"],
    ["programApplicabilities", "program_applicability", "PA"],
    ["medicalSurveillance", "medical_surveillance_requirements", "MSR"],
  ];
  for (const [collection, store, prefix] of directMappings) {
    for (const record of records(source, collection)) {
      addRecord(output, store, directRecord(record, options, timestamp, sourceInstallationId, prefix));
      if (collection === "segs" && ["exposureLevel", "monitoringFrequency", "existingControls"].some((field) => text(record[field]))) {
        createFinding(output, record, collection, "SEG_SCENARIO_FIELDS", "Legacy SEG exposure fields require an Exposure Scenario review.", options, timestamp, sourceInstallationId);
      }
    }
  }

  for (const record of records(source, "processes")) {
    const locationId = text(record.locationId);
    addRecord(output, "processes", directRecord(record, options, timestamp, sourceInstallationId, "PROC", {
      locationId,
      resolvedSiteId: siteByLocation.get(locationId) ?? null,
    }));
  }
  for (const record of records(source, "tasks")) {
    const locationId = text(record.locationId);
    addRecord(output, "tasks", directRecord(record, options, timestamp, sourceInstallationId, "TASK", {
      processId: text(record.processId),
      locationId,
      resolvedSiteId: siteByLocation.get(locationId) ?? null,
    }));
  }
  for (const record of records(source, "equipment")) {
    addRecord(output, "equipment", directRecord(record, options, timestamp, sourceInstallationId, "EQ", {
      locationId: text(record.locationId),
      processId: text(record.processId),
      taskId: text(record.taskId) || null,
    }));
  }

  const substanceByCas = new Map<string, MigratedRecord>();
  const substanceByName = new Map<string, MigratedRecord>();
  const productByName = new Map<string, MigratedRecord>();
  const compositionKeys = new Set<string>();
  for (const substance of existingChemicalIdentity.substances) {
    const cas = text(substance.casNumber);
    if (cas) substanceByCas.set(cas, substance);
    substanceByName.set(text(substance.canonicalName).trim().toLocaleLowerCase(), substance);
  }
  for (const product of existingChemicalIdentity.products) {
    if (product.manufacturerUnknown === true || !text(product.manufacturerOrganizationId)) {
      productByName.set(text(product.productName).trim().replace(/\s+/g, " ").toLocaleLowerCase(), product);
    }
  }
  for (const composition of existingChemicalIdentity.compositions) {
    compositionKeys.add(`${text(composition.productId)}\u0000${text(composition.substanceId)}`);
  }

  for (const record of records(source, "chemicals")) {
    const sourceId = text(record.id);
    const productName = text(record.name, text(record.title)).trim();
    const supplierName = text(record.supplier).trim();
    const explicitManufacturer = text(record.manufacturer).trim();
    const productKey = productName.replace(/\s+/g, " ").toLocaleLowerCase();
    let product = !explicitManufacturer ? productByName.get(productKey) : undefined;
    if (!product) {
      product = deterministicDerivedRecord(record, "product", "PROD", options, timestamp, sourceInstallationId, {
        productName,
        manufacturerOrganizationId: null,
        manufacturerUnknown: !explicitManufacturer,
        supplierOrganizationIds: [],
        productCode: text(record.productCode) || undefined,
        formulationType: text(record.formulationType, "Unknown"),
        physicalState: text(record.physicalState, "Unknown"),
        description: text(record.notes),
        status: legacyLifecycle(record) === "archived" ? "Inactive" : "Active",
        legacySupplierName: supplierName || undefined,
        legacyManufacturerName: explicitManufacturer || undefined,
      });
      product.id = sourceId;
      product.businessId = text(record.businessId).trim() || businessId("PROD", sourceId);
      addRecord(output, "chemical_products", product);
      if (!explicitManufacturer) productByName.set(productKey, product);
    } else {
      createFinding(output, record, "chemicals", "EXISTING_CANONICAL_PRODUCT_MATCH", `Legacy row matched canonical Product ${product.businessId}; no duplicate Product was created.`, options, timestamp, sourceInstallationId);
    }
    const productId = product.id;
    if (!explicitManufacturer) {
      createFinding(output, record, "chemicals", supplierName ? "SUPPLIER_NOT_CONFIRMED_MANUFACTURER" : "MANUFACTURER_MISSING", supplierName
        ? "Legacy supplier text was preserved but not promoted to Manufacturer Organization."
        : "Manufacturer identity is missing.", options, timestamp, sourceInstallationId);
    }

    let casNumber: string | undefined;
    try { casNumber = normalizeCasNumber(text(record.casNumber)); }
    catch {
      createFinding(output, record, "chemicals", "CAS_MALFORMED", "Legacy CAS number is malformed and was not assigned to a canonical Substance.", options, timestamp, sourceInstallationId);
    }
    const substanceName = text(record.substanceName).trim() || (casNumber ? productName : "");
    let substanceId: string | undefined;
    if (substanceName) {
      const substanceKey = substanceName.replace(/\s+/g, " ").toLocaleLowerCase();
      let substance = (casNumber ? substanceByCas.get(casNumber) : undefined) ?? substanceByName.get(substanceKey);
      if (!substance) {
        substance = deterministicDerivedRecord(record, "substance", "SUB", options, timestamp, sourceInstallationId, {
          canonicalName: substanceName,
          casNumber,
          synonyms: [],
          substanceClassifications: [text(record.hazardClass, "Unknown")],
          physicalForm: "Unknown",
          description: "Migrated candidate; review Product versus Substance identity.",
          status: legacyLifecycle(record) === "archived" ? "Inactive" : "Active",
        });
        addRecord(output, "chemical_substances", substance);
        if (casNumber) substanceByCas.set(casNumber, substance);
        substanceByName.set(substanceKey, substance);
      } else if (casNumber && text(substance.canonicalName).replace(/\s+/g, " ").toLocaleLowerCase() !== substanceKey) {
        createFinding(output, record, "chemicals", "CAS_IDENTITY_CONFLICT", `CAS ${casNumber} already maps to ${text(substance.canonicalName)}; the existing Substance was retained.`, options, timestamp, sourceInstallationId);
      }
      substanceId = substance.id;
      const compositionKey = `${productId}\u0000${substanceId}`;
      if (!compositionKeys.has(compositionKey)) {
        addRecord(output, "chemical_product_substances", deterministicDerivedRecord(record, "product-substance", "COMP", options, timestamp, sourceInstallationId, {
          productId,
          substanceId,
          componentRole: "Unknown",
          concentrationUnit: "Not Disclosed",
          tradeSecret: false,
          compositionSource: "Legacy Record",
          notes: "Composition requires confirmation from controlled evidence.",
          status: "Active",
        }));
        compositionKeys.add(compositionKey);
      }
      if (!text(record.substanceName)) createFinding(output, record, "chemicals", "PRODUCT_SUBSTANCE_IDENTITY_UNCERTAIN", "Legacy Product and Substance identity requires review.", options, timestamp, sourceInstallationId);
    } else {
      createFinding(output, record, "chemicals", "COMPOSITION_UNDETERMINED", "No canonical Substance or Product composition was invented from the Product name alone.", options, timestamp, sourceInstallationId);
    }
    let sdsRevisionId: string | undefined;
    if (text(record.sdsReference) || text(record.sdsRevisionDate)) {
      const documentId = `${sourceId}:sds-document`;
      if (text(record.sdsReference)) {
        addRecord(output, "document_references", deterministicDerivedRecord(record, "sds-document", "DOC", options, timestamp, sourceInstallationId, {
          title: `${productName} Safety Data Sheet`,
          documentType: "Safety Data Sheet",
          fileName: text(record.sdsFileName) || undefined,
          externalPath: text(record.sdsReference),
          externalSystem: "Unknown",
          documentDate: text(record.sdsRevisionDate) || undefined,
          availabilityStatus: "Needs Verification",
          notes: "External reference migrated from the legacy Chemical register.",
        }));
      }
      addRecord(output, "sds_revisions", deterministicDerivedRecord(record, "sds", "SDS", options, timestamp, sourceInstallationId, {
        productId,
        manufacturerOrganizationId: null,
        revisionDate: text(record.sdsRevisionDate) || undefined,
        revisionDateUnknown: !text(record.sdsRevisionDate),
        effectiveDate: text(record.sdsEffectiveDate) || undefined,
        receivedDate: undefined,
        language: text(record.sdsLanguage, "Unknown"),
        jurisdiction: text(record.sdsJurisdiction, "Unknown"),
        documentReferenceId: text(record.sdsReference) ? documentId : undefined,
        currentStatus: "Pending Review",
        reviewStatus: "Not Reviewed",
        notes: "Current status was not inferred from legacy file presence.",
      }));
      sdsRevisionId = `${sourceId}:sds`;
      if (!text(record.sdsRevisionDate)) createFinding(output, record, "chemicals", "SDS_REVISION_DATE_MISSING", "SDS revision date is missing.", options, timestamp, sourceInstallationId);
      createFinding(output, record, "chemicals", "SDS_CURRENT_STATUS_UNCERTAIN", "SDS current status requires review and was not invented during migration.", options, timestamp, sourceInstallationId);
    } else {
      createFinding(output, record, "chemicals", "SDS_MISSING", "No SDS reference is present in the legacy Chemical record.", options, timestamp, sourceInstallationId);
    }
    const storageLocationId = text(record.storageLocationId);
    let inventoryId: string | undefined;
    if (storageLocationId) {
      const quantityText = text(record.quantity).trim();
      const quantity = quantityText && Number.isFinite(Number(quantityText)) ? Number(quantityText) : undefined;
      const legacyUnit = text(record.quantityUnit, text(record.unit)).trim().toLowerCase();
      const unitMap: Record<string, string> = { lb: "Pounds", lbs: "Pounds", pounds: "Pounds", kg: "Kilograms", kilogram: "Kilograms", kilograms: "Kilograms", gal: "Gallons", gallon: "Gallons", gallons: "Gallons", l: "Liters", liter: "Liters", liters: "Liters" };
      const quantityUnit = unitMap[legacyUnit] ?? (quantity !== undefined ? "Unknown" : undefined);
      const siteId = siteByLocation.get(storageLocationId);
      addRecord(output, "site_chemical_inventory", deterministicDerivedRecord(record, "inventory", "INV", options, timestamp, sourceInstallationId, {
        productId,
        siteId: siteId ?? null,
        storageLocationId,
        observedQuantity: quantity,
        quantityUnit,
        maximumInventory: undefined,
        maximumInventoryUnit: undefined,
        containerType: "Unknown",
        containerCount: undefined,
        inventoryStatus: "Needs Verification",
        observationDate: undefined,
        informationSource: "Legacy Record",
        notes: text(record.notes),
      }));
      inventoryId = `${sourceId}:inventory`;
      if (!siteId) createFinding(output, record, "chemicals", "STORAGE_SITE_UNRESOLVED", "Storage Location could not resolve to a Site.", options, timestamp, sourceInstallationId);
      if (quantityText && quantity === undefined) createFinding(output, record, "chemicals", "QUANTITY_UNCLEAR", "Legacy quantity is not a valid number.", options, timestamp, sourceInstallationId);
      if (quantity !== undefined && !unitMap[legacyUnit]) createFinding(output, record, "chemicals", "QUANTITY_UNIT_UNCLEAR", "Legacy quantity unit requires review.", options, timestamp, sourceInstallationId);
    }
    const sourceProcesses = records(source, "processes");
    const chemicalUseIds: string[] = [];
    for (const processId of stringArray(record.processIds)) {
      const process = sourceProcesses.find((candidate) => text(candidate.id) === processId);
      if (!process) {
        createFinding(output, record, "chemicals", "PROCESS_RELATIONSHIP_INVALID", `Legacy Process ${processId} was not found; no Chemical Use was created for that link.`, options, timestamp, sourceInstallationId);
        continue;
      }
      const processLocationId = text(process.locationId);
      const processSiteId = siteByLocation.get(processLocationId);
      if (!processSiteId) {
        createFinding(output, record, "chemicals", "PROCESS_SITE_UNRESOLVED", `Legacy Process ${processId} does not resolve to a Site.`, options, timestamp, sourceInstallationId);
        continue;
      }
      addRecord(output, "chemical_uses", deterministicDerivedRecord(record, `use:${slug(processId)}`, "USE", options, timestamp, sourceInstallationId, {
        productId,
        siteId: processSiteId,
        processId,
        taskId: undefined,
        locationId: processLocationId,
        operatingCondition: "Unknown",
        frequency: "Unknown",
        duration: undefined,
        durationUnit: "Unknown",
        quantityScale: "Unknown",
        applicationMethod: "Unknown",
        controlIds: [],
        deferredControlNotes: text(record.existingControls),
        evidenceReferenceIds: [],
        status: "Needs Verification",
        notes: "Created from an explicit legacy Process link; operating details require review.",
      }));
      const added = output.records.get("chemical_uses")!.at(-1)!;
      added.id = `${sourceId}:use:${processId}`;
      added.businessId = businessId("USE", added.id);
      chemicalUseIds.push(added.id);
      createFinding(output, record, "chemicals", "CHEMICAL_USE_CONTEXT_INCOMPLETE", `Chemical Use for Process ${processId} requires Task and operating-condition review.`, options, timestamp, sourceInstallationId);
    }
    if (["exposureLimit", "exposureLimitValue", "exposureLimitUnit", "exposureLimitSource", "exposureLimitAveragingPeriod"].some((field) => text(record[field]))) {
      createFinding(output, record, "chemicals", "CHEMICAL_OEL_REVIEW", "Legacy chemical exposure limit requires explicit agent, type, unit, basis, and source review.", options, timestamp, sourceInstallationId);
    }
    output.chemicalMappings.push({ sourceRecordId: sourceId, productId, substanceId, sdsRevisionId, inventoryId, chemicalUseIds });
  }

  for (const record of records(source, "exposureMonitoring")) {
    const id = text(record.id);
    const agentTitle = text(record.agent, "Unspecified exposure agent");
    const agentId = `legacy-monitoring-agent:${slug(agentTitle)}`;
    if (!(output.records.get("exposure_agents") ?? []).some((agent) => agent.id === agentId)) {
      addRecord(output, "exposure_agents", deterministicDerivedRecord(record, `agent:${slug(agentTitle)}`, "AGT", options, timestamp, sourceInstallationId, {
        title: agentTitle,
        agentType: "unspecified",
      }));
      const agent = output.records.get("exposure_agents")!.at(-1)!;
      agent.id = agentId;
      agent.businessId = businessId("AGT", agentId);
    }
    const planId = `${id}:plan`;
    const eventId = `${id}:event`;
    const sampleId = `${id}:sample`;
    addRecord(output, "sampling_plans", deterministicDerivedRecord(record, "plan", "SPLN", options, timestamp, sourceInstallationId, {
      title: text(record.title),
      exposureScenarioId: null,
      legacySegId: text(record.segId) || null,
      status: "migration-review",
    }));
    addRecord(output, "sampling_events", deterministicDerivedRecord(record, "event", "SEVT", options, timestamp, sourceInstallationId, {
      samplingPlanId: planId,
      occurredAt: iso(record.sampledAt, iso(record.createdAt, timestamp)),
      operatingCondition: text(record.operatingCondition, "unspecified"),
    }));
    addRecord(output, "samples", deterministicDerivedRecord(record, "sample", "SAMP", options, timestamp, sourceInstallationId, {
      samplingEventId: eventId,
      sampleType: text(record.sampleType),
      personId: text(record.personId) || null,
      durationMinutes: null,
      method: null,
    }));
    addRecord(output, "laboratory_results", deterministicDerivedRecord(record, "result", "LAB", options, timestamp, sourceInstallationId, {
      sampleId,
      exposureAgentId: agentId,
      reportedValue: text(record.result),
      unit: text(record.unit),
      qualifier: "reported",
    }));
    createFinding(output, record, "exposureMonitoring", "MONITORING_CONTEXT_INCOMPLETE", "Legacy monitoring result requires sampling duration, method, scenario, and professional review.", options, timestamp, sourceInstallationId);
  }

  const conditionalCollections = ["exposureAssessments", "exposureDeterminations", "samplingCampaigns"];
  for (const collection of conditionalCollections) {
    for (const record of records(source, collection)) {
      output.deferredRecords.push({ collection, record });
      createFinding(output, record, collection, "TYPED_RELATIONSHIP_REQUIRED", `Legacy ${collection} record requires typed relationship review before migration.`, options, timestamp, sourceInstallationId);
    }
  }

  for (const [collection, mapping] of Object.entries(LEGACY_COLLECTION_MAPPING)) {
    if (mapping.disposition !== "defer") continue;
    for (const record of records(source, collection)) {
      output.deferredRecords.push({ collection, record });
      createFinding(output, record, collection, "DEFERRED_FUTURE_MODULE", `Legacy ${collection} record is retained as migration evidence in Future Modules.`, options, timestamp, sourceInstallationId);
    }
  }

  return output;
}

export async function migrateLegacyDatabase(
  database: IDBDatabase,
  sourceValue: unknown,
  options: LegacyMigrationOptions,
): Promise<LegacyMigrationResult> {
  const source = detectLegacySource(sourceValue);
  const priorRunTransaction = database.transaction("migration_runs", "readonly");
  const priorRunCompletion = transactionToPromise(priorRunTransaction);
  const priorRuns = await requestToPromise<AppliedMigrationRun[]>(
    priorRunTransaction.objectStore("migration_runs").getAll(),
  );
  await priorRunCompletion;
  const priorRun = priorRuns.find(
    (run) =>
      run.status === "applied" &&
      fingerprintsMatch(run.sourceFingerprint, source.fingerprint),
  );
  if (priorRun) {
    return {
      migrationRunId: priorRun.id,
      sourceKind: priorRun.sourceKind,
      sourceSchemaVersion: priorRun.sourceSchemaVersion,
      importedRecordCount: priorRun.importedRecordCount,
      dataQualityFindingCount:
        priorRun.dataQualityFindingCount ?? priorRun.countsByStore.data_quality_findings ?? 0,
      deferredRecordCount: priorRun.deferredRecordCount,
      countsByStore: priorRun.countsByStore,
      alreadyApplied: true,
    };
  }
  const timestamp = (options.now ?? (() => new Date()))().toISOString();
  const migrationRunId = options.migrationRunId ?? `migration:${source.kind}:${source.schemaVersion}:${timestamp}`;
  const identityTransaction = database.transaction(
    ["chemical_substances", "chemical_products", "chemical_product_substances"],
    "readonly",
  );
  const identityCompletion = transactionToPromise(identityTransaction);
  const [existingSubstances, existingProducts, existingCompositions] = await Promise.all([
    requestToPromise<MigratedRecord[]>(identityTransaction.objectStore("chemical_substances").getAll()),
    requestToPromise<MigratedRecord[]>(identityTransaction.objectStore("chemical_products").getAll()),
    requestToPromise<MigratedRecord[]>(identityTransaction.objectStore("chemical_product_substances").getAll()),
  ]);
  const existingChemicalIdentity: ExistingChemicalIdentity = {
    substances: existingSubstances,
    products: existingProducts,
    compositions: existingCompositions,
  };
  await identityCompletion;
  const prepared = prepareMigration(source, options, timestamp, existingChemicalIdentity);
  const storeNames = [...prepared.records.keys()];
  const countsByStore = Object.fromEntries(
    [...prepared.records.entries()].map(([store, storeRecords]) => [store, storeRecords.length]),
  );
  const context: MutationContext = {
    actorId: options.actorId,
    installationId: options.installationId,
    source: "migration",
    reason: `Migrate ${source.kind} schema ${source.schemaVersion}`,
  };

  const importedRecordCount = [...prepared.records.values()].reduce(
    (total, storeRecords) => total + storeRecords.length,
    0,
  );
  const result: LegacyMigrationResult = {
    migrationRunId,
    sourceKind: source.kind,
    sourceSchemaVersion: source.schemaVersion,
    importedRecordCount,
    dataQualityFindingCount: prepared.dataQualityFindings.length,
    deferredRecordCount: prepared.deferredRecords.length,
    countsByStore,
  };

  return runMutationTransaction(
    database,
    storeNames,
    context,
    async (session) => {
      for (const [storeName, storeRecords] of prepared.records) {
        for (const record of storeRecords) {
          try {
            await session.importRecord({ storeName, recordType: storeName, record });
          } catch (cause) {
            throw new AdamaDatabaseError(
              `Migration could not import ${storeName} record ${record.id} (${record.businessId}) because its identity conflicts with another record.`,
              "MIGRATION_RECORD_CONFLICT",
              cause,
            );
          }
        }
      }
      await session.putMigrationRun({
        id: migrationRunId,
        status: "applied",
        sourceKind: source.kind,
        sourceSchemaVersion: source.schemaVersion,
        sourceFingerprint: source.fingerprint,
        startedAt: timestamp,
        completedAt: timestamp,
        actorId: options.actorId,
        installationId: options.installationId,
        countsByStore,
        importedRecordCount,
        dataQualityFindingCount: prepared.dataQualityFindings.length,
        deferredRecordCount: prepared.deferredRecords.length,
        deferredRecords: prepared.deferredRecords,
        sourceEvidence: {
          chemicals: records(source, "chemicals").map((record) => structuredClone(record)),
        },
        chemicalMappings: prepared.chemicalMappings,
      });
      return result;
    },
    {
      now: options.now,
      additionalStoreNames: ["migration_runs"],
    },
  );
}
