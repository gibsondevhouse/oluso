import {
  REGISTER_CONFIGS,
  type MvpRegisterKind,
} from "$lib/components/register/register-config";
import type {
  PersistedRegisterRecord,
  RegisterCollectionName,
} from "$lib/persistence/local-persistence";
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
  href: string;
  archived: boolean;
  linkedReferenceCount: number;
  updatedAt: string;
}

export type GlobalSearchResultKind = MvpRegisterKind | "organizations" | "people" | "tasks" | "operational-functions";

export interface TypedEnterpriseSearchContext {
  organizations: Organization[];
  people: Person[];
  locations: Location[];
  operationalFunctions: OperationalFunction[];
  processes: Process[];
  tasks: Task[];
}

export const TYPED_ENTERPRISE_SEARCH_OPTIONS: Array<{ kind: GlobalSearchResultKind; label: string }> = [
  { kind: "organizations", label: "Organizations" },
  { kind: "people", label: "People" },
  { kind: "locations", label: "Locations" },
  { kind: "operational-functions", label: "Operational Functions" },
  { kind: "processes", label: "Processes" },
  { kind: "tasks", label: "Tasks" },
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

type TypedEnterpriseRecord = Organization | Person | Location | OperationalFunction | Process | Task;

interface TypedSearchEntry {
  kind: GlobalSearchResultKind;
  registerTitle: string;
  record: TypedEnterpriseRecord;
  recordTitle: string;
  recordType: string;
  href: string;
}

export function searchTypedEnterpriseRecords(
  context: TypedEnterpriseSearchContext,
  query: string,
  options: { includeArchived?: boolean } = {},
): GlobalSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const entries: TypedSearchEntry[] = [
    ...context.organizations.map((record) => ({ kind: "organizations" as const, registerTitle: "Organizations", record, recordTitle: record.name, recordType: record.organizationType, href: `/people/organizations/${encodeURIComponent(record.id)}` })),
    ...context.people.map((record) => ({ kind: "people" as const, registerTitle: "People", record, recordTitle: record.displayName, recordType: record.personType, href: `/people/workers/${encodeURIComponent(record.id)}` })),
    ...context.locations.map((record) => ({ kind: "locations" as const, registerTitle: "Locations", record, recordTitle: record.name, recordType: record.nodeType, href: `/operations/locations/${encodeURIComponent(record.id)}` })),
    ...context.operationalFunctions.map((record) => ({ kind: "operational-functions" as const, registerTitle: "Operational Functions", record, recordTitle: record.name, recordType: record.functionCategory, href: "/enterprise/navigator" })),
    ...context.processes.map((record) => ({ kind: "processes" as const, registerTitle: "Processes", record, recordTitle: record.name, recordType: record.processType, href: `/operations/processes/${encodeURIComponent(record.id)}` })),
    ...context.tasks.map((record) => ({ kind: "tasks" as const, registerTitle: "Tasks", record, recordTitle: record.name, recordType: record.taskType, href: `/operations/tasks/${encodeURIComponent(record.id)}` })),
  ];

  return entries.flatMap((entry) => {
    const { record } = entry;
    if (!options.includeArchived && record.lifecycleStatus === "archived") return [];
    const statusLabel = record.lifecycleStatus === "archived" ? "Archived" : record.status;
    const segments = uniqueSegments([
      entry.registerTitle,
      entry.recordTitle,
      entry.recordType,
      statusLabel,
      ...collectSearchSegments(record),
    ]);
    if (!normalizeSearchText(segments.join(" ")).includes(normalizedQuery)) return [];
    return [{
      id: `typed:${entry.kind}:${record.id}`,
      kind: entry.kind,
      registerTitle: entry.registerTitle,
      recordTitle: entry.recordTitle,
      statusLabel,
      statusTone: record.lifecycleStatus === "archived" || record.status === "Inactive" ? "inactive" : record.status === "Active" ? "positive" : "review",
      matchedText: findMatchedText(segments, normalizedQuery, entry.recordTitle),
      href: entry.href,
      archived: record.lifecycleStatus === "archived",
      linkedReferenceCount: typedLinkedReferenceCount(record),
      updatedAt: record.updatedAt,
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
          href: `${config.basePath}/${encodeURIComponent(record.id)}`,
          archived: record.lifecycleStatus === "archived",
          linkedReferenceCount: linkedReferenceCount(record),
          updatedAt: recordUpdatedAt(record),
        },
      ];
    });
  });
}
