import {
  AdamaDatabaseError,
  type AdamaStoreName,
  type MutationContext,
  type RecordEnvelope,
} from "$lib/data/database";
import { runMutationTransaction } from "$lib/data/revisions";
import {
  isValidLocationParent,
  resolveSiteForLocation,
  type FoundationLocation,
  type LocationNodeType,
} from "$lib/domain/foundation";

const DEPENDENCY_STORES = [
  "processes",
  "tasks",
  "equipment",
  "site_chemical_inventory",
  "chemical_uses",
  "segs",
  "exposure_scenarios",
  "sampling_plans",
  "sampling_events",
  "samples",
  "findings",
  "incidents",
  "corrective_actions",
] as const satisfies readonly AdamaStoreName[];

const LOCATION_REFERENCE_FIELDS = new Set([
  "locationId",
  "siteId",
  "storageLocationId",
  "resolvedSiteId",
  "sourceLocationId",
  "targetLocationId",
]);

function reclassificationError(message: string) {
  return new AdamaDatabaseError(message, "LOCATION_RECLASSIFICATION_BLOCKED");
}

function isActive(record: Record<string, unknown>) {
  return record.lifecycleStatus !== "archived" && record.status !== "archived";
}

function referencesLocation(record: Record<string, unknown>, locationId: string) {
  return Object.entries(record).some(([field, value]) => {
    if (!LOCATION_REFERENCE_FIELDS.has(field)) return false;
    if (value === locationId) return true;
    return Array.isArray(value) && value.includes(locationId);
  });
}

export class FoundationLocationService {
  constructor(
    private readonly database: IDBDatabase,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  async reclassifyLeaf(
    id: string,
    nodeType: LocationNodeType,
    expectedRevision: number,
    context: MutationContext,
  ) {
    return runMutationTransaction(
      this.database,
      ["locations"],
      context,
      async (session) => {
        const location = await session.getRecord<FoundationLocation>("locations", id);
        if (!location || location.lifecycleStatus === "archived") {
          throw new Error("Location was not found or is archived.");
        }
        if (location.nodeType === nodeType) return location;

        const locations = await session.listRecords<FoundationLocation>("locations");
        if (locations.some((candidate) => candidate.parentId === id && candidate.lifecycleStatus !== "archived")) {
          throw reclassificationError("Location type cannot change while active child Locations exist.");
        }
        for (const storeName of DEPENDENCY_STORES) {
          const dependencies = await session.listRecords<Record<string, unknown> & RecordEnvelope>(storeName);
          if (dependencies.some((record) => isActive(record) && referencesLocation(record, id))) {
            throw reclassificationError(`Location type cannot change while active ${storeName.replaceAll("_", " ")} dependencies exist.`);
          }
        }

        const parent = location.parentId
          ? locations.find((candidate) => candidate.id === location.parentId) ?? null
          : null;
        if (!isValidLocationParent(nodeType, parent)) {
          throw reclassificationError("The current parent is incompatible with the proposed Location type.");
        }
        const resolvedSiteId = resolveSiteForLocation(nodeType, location.id, parent);
        if (!["Country", "StateOrRegion"].includes(nodeType) && !resolvedSiteId) {
          throw reclassificationError("The proposed Location type does not resolve to a valid Site.");
        }
        return session.updateRecord<FoundationLocation, Record<string, unknown>>({
          storeName: "locations",
          recordType: "Location",
          id,
          expectedRevision,
          patch: { nodeType, resolvedSiteId },
        });
      },
      {
        now: this.now,
        createId: this.createId,
        additionalStoreNames: [...DEPENDENCY_STORES],
      },
    );
  }
}
