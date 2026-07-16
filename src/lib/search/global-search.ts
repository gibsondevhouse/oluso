import {
  REGISTER_CONFIGS,
  type MvpRegisterKind,
} from "$lib/components/register/register-config";
import type {
  PersistedRegisterRecord,
  RegisterCollectionName,
} from "$lib/persistence/local-persistence";

interface GlobalSearchApplication {
  listRegisterRecords(
    collection: RegisterCollectionName,
    options?: { includeArchived?: boolean },
  ): PersistedRegisterRecord[];
}

export interface GlobalSearchResult {
  id: string;
  kind: MvpRegisterKind;
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

export const GLOBAL_SEARCH_REGISTER_KINDS: MvpRegisterKind[] = [
  ...(Object.keys(REGISTER_CONFIGS) as MvpRegisterKind[]),
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
    return Object.values(value as Record<string, unknown>).flatMap((item) =>
      collectSearchSegments(item),
    );
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
