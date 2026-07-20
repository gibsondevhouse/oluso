import type { RecordRevision } from "$lib/data/database";
import { requestToPromise, transactionToPromise } from "$lib/data/database/idb-utils";
import type { PersistedRegisterRecord } from "$lib/persistence/local-persistence";
import type { PortalSourceState } from "./portal-query.types";

export interface ActivityRecordReference {
  recordType: string;
  recordId: string;
  recordTitle: string;
  href: string;
  scopeLabel: string;
}

export interface ActivityFeedItem extends ActivityRecordReference {
  id: string;
  eventType: string;
  summary: string;
  actor: string;
  timestamp: string;
  sourceRevisionId: string;
  sourcePackage: string;
  sourceState: PortalSourceState;
  sourceLabel: string;
  sourceDetail: string;
}

export interface LegacyActivityDescriptor {
  recordType: string;
  recordLabel: string;
  href: (record: PersistedRegisterRecord) => string;
  title: (record: PersistedRegisterRecord) => string;
  scope?: (record: PersistedRegisterRecord) => string;
}

export interface ActivityFeedReadModel {
  items: ActivityFeedItem[];
  sourceSummary: string;
  limitedHistoryCount: number;
}

const RECORD_TYPE_ROUTES: Record<string, (recordId: string, record?: Record<string, unknown>) => string> = {
  Organization: (id) => `/people/organizations/${encodeURIComponent(id)}`,
  Person: (id) => `/people/workers/${encodeURIComponent(id)}`,
  Location: (id) => `/operations/locations/${encodeURIComponent(id)}`,
  OperationalFunction: () => "/enterprise/navigator",
  Process: (id) => `/operations/processes/${encodeURIComponent(id)}`,
  Task: (id) => `/operations/tasks/${encodeURIComponent(id)}`,
  ChemicalSubstance: (id) => `/master/substances/${encodeURIComponent(id)}`,
  ChemicalProduct: (id) => `/master/products/${encodeURIComponent(id)}`,
  SiteChemicalInventory: (id) => `/master/inventory/${encodeURIComponent(id)}`,
  ChemicalUse: (id) => `/master/chemical-uses/${encodeURIComponent(id)}`,
  SdsRevision: (id, record) => {
    const productId = typeof record?.productId === "string" ? record.productId : "";
    return productId
      ? `/master/products/${encodeURIComponent(productId)}/sds/${encodeURIComponent(id)}`
      : `/master/products`;
  },
};

const OPERATION_LABELS: Record<string, string> = {
  create: "Created",
  update: "Updated",
  archive: "Archived",
  restore: "Restored",
  supersede: "Superseded",
  import: "Imported",
  resolve: "Resolved",
  tombstone: "Tombstoned",
};

function recordValue(record: unknown, ...keys: string[]) {
  if (!record || typeof record !== "object") return "";
  const values = record as Record<string, unknown>;

  for (const key of keys) {
    const value = values[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function titleForRevision(revision: RecordRevision) {
  const record = (revision.after ?? revision.before) as Record<string, unknown> | undefined;
  return (
    recordValue(record, "displayName", "name", "title", "productName", "canonicalName", "businessId") ||
    `${revision.recordType} ${revision.recordId}`
  );
}

function scopeForRevision(revision: RecordRevision) {
  const record = (revision.after ?? revision.before) as Record<string, unknown> | undefined;
  return (
    recordValue(record, "resolvedSiteId", "siteId", "primarySiteId", "locationId", "originInstallationId") ||
    "Scope not resolved"
  );
}

function routeForRevision(revision: RecordRevision) {
  const record = (revision.after ?? revision.before) as Record<string, unknown> | undefined;
  const route = RECORD_TYPE_ROUTES[revision.recordType];
  return route ? route(revision.recordId, record) : "/search";
}

function eventLabel(operation: string) {
  return OPERATION_LABELS[operation] ?? operation;
}

export async function listActivityRevisions(database: IDBDatabase) {
  const transaction = database.transaction("record_revisions", "readonly");
  const completion = transactionToPromise(transaction);
  const revisions = await requestToPromise<RecordRevision[]>(
    transaction.objectStore("record_revisions").getAll(),
  );
  await completion;
  return revisions;
}

export function activityItemFromRevision(revision: RecordRevision): ActivityFeedItem {
  const recordTitle = titleForRevision(revision);
  const eventType = eventLabel(revision.operation);

  return {
    id: `revision-${revision.id}`,
    eventType,
    recordType: revision.recordType,
    recordId: revision.recordId,
    recordTitle,
    summary: `${eventType} ${recordTitle} at revision ${revision.revision}.`,
    actor: revision.changedBy,
    timestamp: revision.changedAt,
    scopeLabel: scopeForRevision(revision),
    sourceRevisionId: revision.id,
    sourcePackage: revision.exchangePackageId ?? "Local mutation",
    href: routeForRevision(revision),
    sourceState: "current",
    sourceLabel: "Immutable record revision",
    sourceDetail: `${revision.recordType} revision ${revision.revision}; source ${revision.source}.`,
  };
}

export function limitedActivityFromLegacyRecord(
  record: PersistedRegisterRecord,
  descriptor: LegacyActivityDescriptor,
): ActivityFeedItem | null {
  const timestamp = typeof record.updatedAt === "string"
    ? record.updatedAt
    : typeof record.createdAt === "string"
      ? record.createdAt
      : "";
  if (!timestamp) return null;

  return {
    id: `legacy-${descriptor.recordType}-${record.id}`,
    eventType: "Metadata updated",
    recordType: descriptor.recordType,
    recordId: record.id,
    recordTitle: descriptor.title(record),
    summary: `${descriptor.recordLabel} changed according to retained created/updated metadata.`,
    actor: "Local record metadata",
    timestamp,
    scopeLabel: descriptor.scope?.(record) ?? "Scope not resolved",
    sourceRevisionId: "No governed revision retained",
    sourcePackage: "Legacy/local metadata",
    href: descriptor.href(record),
    sourceState: "limited-history",
    sourceLabel: "Limited legacy history",
    sourceDetail:
      "This row is not field-level audit history; it is derived from retained created/updated metadata.",
  };
}

export function buildActivityFeedReadModel(
  revisions: RecordRevision[],
  limitedLegacyItems: Array<ActivityFeedItem | null> = [],
  limit = 80,
): ActivityFeedReadModel {
  const items = [
    ...revisions.map(activityItemFromRevision),
    ...limitedLegacyItems.filter((item): item is ActivityFeedItem => Boolean(item)),
  ].sort((left, right) => {
    const timestamp = right.timestamp.localeCompare(left.timestamp);
    if (timestamp !== 0) return timestamp;
    const source = left.sourceState.localeCompare(right.sourceState);
    if (source !== 0) return source;
    return `${left.recordType}-${left.recordTitle}-${left.sourceRevisionId}`.localeCompare(
      `${right.recordType}-${right.recordTitle}-${right.sourceRevisionId}`,
    );
  }).slice(0, limit);

  const revisionCount = items.filter((item) => item.sourceState === "current").length;
  const limitedHistoryCount = items.filter((item) => item.sourceState === "limited-history").length;

  return {
    items,
    limitedHistoryCount,
    sourceSummary: `${revisionCount} revision-sourced events; ${limitedHistoryCount} limited-history metadata rows.`,
  };
}
