import {
  REGISTER_CONFIGS,
  type MvpRegisterKind,
} from "$lib/components/register/register-config";
import type {
  PersistedRegisterRecord,
  RegisterCollectionName,
} from "$lib/persistence/local-persistence";
import type {
  ChemicalProduct,
  ChemicalSubstance,
  ChemicalUse,
  SdsRevision,
  SiteChemicalInventory,
} from "$lib/domain/chemical";
import type { Organization, Person } from "$lib/domain/foundation";
import type { Location } from "$lib/domain/location";
import type { OperationalFunction, Process, Task } from "$lib/domain/operations";

interface GlobalSearchApplication {
  listRegisterRecords(
    collection: RegisterCollectionName,
    options?: { includeArchived?: boolean },
  ): PersistedRegisterRecord[];
}

export interface GlobalSearchResult {
  id: string;
  kind: GlobalSearchResultKind;
  registerTitle: string;
  recordTitle: string;
  statusLabel: string;
  statusTone: string;
  matchedText: string;
  matchedField: string;
  href: string;
  archived: boolean;
  linkedReferenceCount: number;
  updatedAt: string;
  sourceState: "current" | "legacy";
  sourceLabel: string;
  rank: number;
}

export type GlobalSearchResultKind =
  | MvpRegisterKind
  | "organizations"
  | "people"
  | "tasks"
  | "operational-functions"
  | "chemical-substances"
  | "chemical-products"
  | "chemical-inventory"
  | "chemical-uses"
  | "sds-revisions";

export interface TypedEnterpriseSearchContext {
  organizations: Organization[];
  people: Person[];
  locations: Location[];
  operationalFunctions: OperationalFunction[];
  processes: Process[];
  tasks: Task[];
  chemicalSubstances?: ChemicalSubstance[];
  chemicalProducts?: ChemicalProduct[];
  siteChemicalInventory?: SiteChemicalInventory[];
  chemicalUses?: ChemicalUse[];
  sdsRevisions?: SdsRevision[];
}

export const TYPED_ENTERPRISE_SEARCH_OPTIONS: Array<{ kind: GlobalSearchResultKind; label: string }> = [
  { kind: "organizations", label: "Organizations" },
  { kind: "people", label: "People" },
  { kind: "locations", label: "Locations" },
  { kind: "operational-functions", label: "Operational Functions" },
  { kind: "processes", label: "Processes" },
  { kind: "tasks", label: "Tasks" },
  { kind: "chemical-substances", label: "Chemical Substances" },
  { kind: "chemical-products", label: "Chemical Products" },
  { kind: "chemical-inventory", label: "Site Chemical Inventory" },
  { kind: "chemical-uses", label: "Chemical Uses" },
  { kind: "sds-revisions", label: "SDS Revisions" },
];

export const GLOBAL_SEARCH_REGISTER_KINDS: MvpRegisterKind[] = [
  ...(Object.keys(REGISTER_CONFIGS) as MvpRegisterKind[]).filter((kind) => kind !== "chemicals"),
];

function normalizeSearchText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function compactText(value: string, maxLength = 160) {
  const compacted = value.replace(/\s+/g, " ").trim();
  if (compacted.length <= maxLength) {
    return compacted;
  }

  return `${compacted.slice(0, maxLength - 3).trimEnd()}...`;
}

function dateSortValue(value: string | null | undefined, fallback = "9999-12-31") {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : fallback;
}

function collectSearchSegments(value: unknown): string[] {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSearchSegments(item));
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "id" && !key.endsWith("Id") && !key.endsWith("Ids"))
      .flatMap(([, item]) => collectSearchSegments(item));
  }

  return [];
}

function uniqueSegments(segments: string[]) {
  const seen = new Set<string>();

  return segments
    .map((segment) => segment.trim())
    .filter((segment) => {
      if (!segment || seen.has(segment)) {
        return false;
      }

      seen.add(segment);
      return true;
    });
}

function findMatchedText(segments: string[], normalizedQuery: string, fallback: string) {
  const exactSegment = segments.find((segment) =>
    normalizeSearchText(segment).includes(normalizedQuery),
  );

  return compactText(exactSegment ?? fallback);
}

function findMatchedField(
  segments: Array<{ field: string; value: string }>,
  normalizedQuery: string,
  fallback = "Record fields",
) {
  return (
    segments.find((segment) => normalizeSearchText(segment.value).includes(normalizedQuery))
      ?.field ?? fallback
  );
}

function matchRank(recordTitle: string, businessId: string | undefined, segments: string[], normalizedQuery: string) {
  const normalizedTitle = normalizeSearchText(recordTitle);
  const normalizedBusinessId = businessId ? normalizeSearchText(businessId) : "";

  if (normalizedTitle === normalizedQuery) return 1000;
  if (normalizedBusinessId && normalizedBusinessId === normalizedQuery) return 980;
  if (normalizedTitle.startsWith(normalizedQuery)) return 900;
  if (normalizedBusinessId && normalizedBusinessId.startsWith(normalizedQuery)) return 880;
  if (segments.some((segment) => normalizeSearchText(segment) === normalizedQuery)) return 820;
  if (normalizedTitle.includes(normalizedQuery)) return 760;
  if (segments.some((segment) => normalizeSearchText(segment).startsWith(normalizedQuery))) return 640;
  return 420;
}

function recordUpdatedAt(record: PersistedRegisterRecord) {
  return typeof record.updatedAt === "string" ? record.updatedAt : "";
}

function linkedReferenceCount(record: PersistedRegisterRecord) {
  return Object.entries(record as unknown as Record<string, unknown>).reduce((total, [key, value]) => {
    if (key === "id" || (!key.endsWith("Id") && !key.endsWith("Ids"))) return total;
    if (Array.isArray(value)) return total + value.filter((item) => typeof item === "string" && item.trim()).length;
    return total + (typeof value === "string" && value.trim() ? 1 : 0);
  }, 0);
}

function typedLinkedReferenceCount(record: object) {
  return Object.entries(record).reduce((total, [key, value]) => {
    if (key === "id" || (!key.endsWith("Id") && !key.endsWith("Ids"))) return total;
    if (Array.isArray(value)) return total + value.filter((item) => typeof item === "string" && item.trim()).length;
    return total + (typeof value === "string" && value.trim() ? 1 : 0);
  }, 0);
}

type TypedEnterpriseRecord =
  | Organization
  | Person
  | Location
  | OperationalFunction
  | Process
  | Task
  | ChemicalSubstance
  | ChemicalProduct
  | SiteChemicalInventory
  | ChemicalUse
  | SdsRevision;

interface TypedSearchEntry {
  kind: GlobalSearchResultKind;
  registerTitle: string;
  record: TypedEnterpriseRecord;
  recordTitle: string;
  recordType: string;
  statusLabel: string;
  href: string;
}

function recordStatus(record: TypedEnterpriseRecord, fallback = "Active") {
  if ("status" in record && typeof record.status === "string") {
    return record.status;
  }

  if ("currentStatus" in record && typeof record.currentStatus === "string") {
    return "reviewStatus" in record && record.reviewStatus
      ? `${record.currentStatus}; ${record.reviewStatus}`
      : record.currentStatus;
  }

  if ("inventoryStatus" in record && typeof record.inventoryStatus === "string") {
    return record.inventoryStatus;
  }

  return fallback;
}

function namedRecordTitle(
  records: Array<{ id: string; name?: string; productName?: string }>,
  id: string,
  fallback: string,
) {
  const record = records.find((item) => item.id === id);
  return record?.name ?? record?.productName ?? fallback;
}

function typedStatusTone(record: TypedEnterpriseRecord, statusLabel: string) {
  if (record.lifecycleStatus === "archived") return "inactive";
  if (/inactive|unknown|not reviewed|pending|needs|unavailable/i.test(statusLabel)) return "review";
  return /active|current|accepted|present/i.test(statusLabel) ? "positive" : "review";
}

export function searchTypedEnterpriseRecords(
  context: TypedEnterpriseSearchContext,
  query: string,
  options: { includeArchived?: boolean } = {},
): GlobalSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const chemicalProducts = context.chemicalProducts ?? [];
  const locations = context.locations.map((location) => ({ id: location.id, name: location.name }));
  const processes = context.processes.map((process) => ({ id: process.id, name: process.name }));
  const productTitles = chemicalProducts.map((product) => ({
    id: product.id,
    productName: product.productName,
  }));

  const entries: TypedSearchEntry[] = [
    ...context.organizations.map((record) => ({ kind: "organizations" as const, registerTitle: "Organizations", record, recordTitle: record.name, recordType: record.organizationType, statusLabel: recordStatus(record), href: `/people/organizations/${encodeURIComponent(record.id)}` })),
    ...context.people.map((record) => ({ kind: "people" as const, registerTitle: "People", record, recordTitle: record.displayName, recordType: record.personType, statusLabel: recordStatus(record), href: `/people/workers/${encodeURIComponent(record.id)}` })),
    ...context.locations.map((record) => ({ kind: "locations" as const, registerTitle: "Locations", record, recordTitle: record.name, recordType: record.nodeType, statusLabel: recordStatus(record), href: `/operations/locations/${encodeURIComponent(record.id)}` })),
    ...context.operationalFunctions.map((record) => ({ kind: "operational-functions" as const, registerTitle: "Operational Functions", record, recordTitle: record.name, recordType: record.functionCategory, statusLabel: recordStatus(record), href: "/enterprise/navigator" })),
    ...context.processes.map((record) => ({ kind: "processes" as const, registerTitle: "Processes", record, recordTitle: record.name, recordType: record.processType, statusLabel: recordStatus(record), href: `/operations/processes/${encodeURIComponent(record.id)}` })),
    ...context.tasks.map((record) => ({ kind: "tasks" as const, registerTitle: "Tasks", record, recordTitle: record.name, recordType: record.taskType, statusLabel: recordStatus(record), href: `/operations/tasks/${encodeURIComponent(record.id)}` })),
    ...(context.chemicalSubstances ?? []).map((record) => ({ kind: "chemical-substances" as const, registerTitle: "Chemical Substances", record, recordTitle: record.canonicalName, recordType: record.substanceClassifications.join(", ") || record.physicalForm, statusLabel: recordStatus(record), href: `/master/substances/${encodeURIComponent(record.id)}` })),
    ...chemicalProducts.map((record) => ({ kind: "chemical-products" as const, registerTitle: "Chemical Products", record, recordTitle: record.productName, recordType: record.formulationType, statusLabel: recordStatus(record), href: `/master/products/${encodeURIComponent(record.id)}` })),
    ...(context.siteChemicalInventory ?? []).map((record) => ({ kind: "chemical-inventory" as const, registerTitle: "Site Chemical Inventory", record, recordTitle: `${namedRecordTitle(productTitles, record.productId, "Missing Product")} inventory`, recordType: record.containerType, statusLabel: recordStatus(record), href: `/master/inventory/${encodeURIComponent(record.id)}` })),
    ...(context.chemicalUses ?? []).map((record) => ({ kind: "chemical-uses" as const, registerTitle: "Chemical Uses", record, recordTitle: `${namedRecordTitle(productTitles, record.productId, "Missing Product")} use`, recordType: record.operatingCondition, statusLabel: recordStatus(record), href: `/master/chemical-uses/${encodeURIComponent(record.id)}` })),
    ...(context.sdsRevisions ?? []).map((record) => ({ kind: "sds-revisions" as const, registerTitle: "SDS Revisions", record, recordTitle: `${namedRecordTitle(productTitles, record.productId, "Missing Product")} SDS ${record.revisionDate ?? record.businessId}`, recordType: record.jurisdiction, statusLabel: recordStatus(record), href: `/master/products/${encodeURIComponent(record.productId)}/sds/${encodeURIComponent(record.id)}` })),
  ];

  return entries.flatMap((entry) => {
    const { record } = entry;
    if (!options.includeArchived && record.lifecycleStatus === "archived") return [];
    const statusLabel = record.lifecycleStatus === "archived" ? "Archived" : entry.statusLabel;
    const segments = uniqueSegments([
      entry.registerTitle,
      entry.recordTitle,
      entry.recordType,
      statusLabel,
      record.businessId,
      namedRecordTitle(productTitles, "productId" in record ? record.productId : "", ""),
      namedRecordTitle(locations, "siteId" in record ? record.siteId : "", ""),
      namedRecordTitle(locations, "locationId" in record ? record.locationId : "", ""),
      namedRecordTitle(processes, "processId" in record ? record.processId : "", ""),
      ...collectSearchSegments(record),
    ]);
    const labeledSegments = [
      { field: "Record type", value: entry.registerTitle },
      { field: "Title", value: entry.recordTitle },
      { field: "Business ID", value: record.businessId },
      { field: "Status", value: statusLabel },
      { field: "Record fields", value: segments.join(" ") },
    ];
    if (!normalizeSearchText(segments.join(" ")).includes(normalizedQuery)) return [];
    return [{
      id: `typed:${entry.kind}:${record.id}`,
      kind: entry.kind,
      registerTitle: entry.registerTitle,
      recordTitle: entry.recordTitle,
      statusLabel,
      statusTone: typedStatusTone(record, statusLabel),
      matchedText: findMatchedText(segments, normalizedQuery, entry.recordTitle),
      matchedField: findMatchedField(labeledSegments, normalizedQuery),
      href: entry.href,
      archived: record.lifecycleStatus === "archived",
      linkedReferenceCount: typedLinkedReferenceCount(record),
      updatedAt: record.updatedAt,
      sourceState: "current",
      sourceLabel: "Current typed record",
      rank: matchRank(entry.recordTitle, record.businessId, segments, normalizedQuery),
    } satisfies GlobalSearchResult];
  });
}

export function searchAllRegisters(
  application: GlobalSearchApplication,
  query: string,
  options: { includeArchived?: boolean } = {},
): GlobalSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  return GLOBAL_SEARCH_REGISTER_KINDS.flatMap((kind) => {
    const config = REGISTER_CONFIGS[kind];
    const records = application.listRegisterRecords(config.collection, {
      includeArchived: options.includeArchived,
    });

    return records.flatMap((record) => {
      const recordTitle = config.getRecordTitle(record);
      const statusLabel = config.getStatusLabel(record);
      const segments = uniqueSegments([
        config.title,
        config.recordLabel,
        recordTitle,
        statusLabel,
        ...collectSearchSegments(record),
      ]);
      const labeledSegments = [
        { field: "Register", value: config.title },
        { field: "Title", value: recordTitle },
        { field: "Status", value: statusLabel },
        { field: "Record fields", value: segments.join(" ") },
      ];
      const haystack = normalizeSearchText(segments.join(" "));

      if (!haystack.includes(normalizedQuery)) {
        return [];
      }

      return [
        {
          id: `${kind}:${record.id}`,
          kind,
          registerTitle: config.title,
          recordTitle,
          statusLabel,
          statusTone: config.getStatusTone(record),
          matchedText: findMatchedText(segments, normalizedQuery, recordTitle),
          matchedField: findMatchedField(labeledSegments, normalizedQuery),
          href: `${config.basePath}/${encodeURIComponent(record.id)}`,
          archived: record.lifecycleStatus === "archived",
          linkedReferenceCount: linkedReferenceCount(record),
          updatedAt: recordUpdatedAt(record),
          sourceState: "legacy",
          sourceLabel: "Retained legacy register",
          rank: matchRank(recordTitle, undefined, segments, normalizedQuery),
        },
      ];
    });
  });
}

export function sortGlobalSearchResults(results: GlobalSearchResult[]) {
  return [...results].sort((left, right) => {
    const rank = right.rank - left.rank;
    if (rank !== 0) return rank;

    if (left.sourceState !== right.sourceState) {
      return left.sourceState === "current" ? -1 : 1;
    }

    const updated = dateSortValue(right.updatedAt, "0000-00-00").localeCompare(
      dateSortValue(left.updatedAt, "0000-00-00"),
    );
    if (updated !== 0) return updated;

    return left.recordTitle.localeCompare(right.recordTitle);
  });
}
