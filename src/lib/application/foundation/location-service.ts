import {
  AdamaDatabaseError,
  type AdamaStoreName,
  type MutationContext,
  type RecordEnvelope,
} from "$lib/data/database";
import {
  LocationRepository,
  ProcessRepository,
  TaskRepository,
  type LocationDependentMutation,
} from "$lib/data/repositories/foundation";
import { runMutationTransaction } from "$lib/data/revisions";
import {
  CircularHierarchyError,
  CrossSiteRelationshipError,
  InvalidParentTypeError,
  LOCATION_PARENT_TYPES,
  ValidationError,
  assertValid,
  isOperationalLocation,
  isValidLocationParent,
  resolveLocationAncestry,
  resolveSiteForLocation,
  validateLocation,
  type FoundationLocation,
  type Location,
  type LocationFields,
  type LocationNodeType,
  type ResolvedLocationAncestry,
} from "$lib/domain/foundation";
import { assignmentIsEffective, type LocationFunctionAssignment, type ProcessLocationAssignment } from "$lib/domain/operations";
import { FoundationService, type FoundationServiceOptions } from "./foundation-service";

const DEPENDENCY_STORES = [
  "location_function_assignments",
  "organization_location_assignments",
  "organization_function_responsibilities",
  "processes",
  "process_location_assignments",
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

const DEPENDENT_MUTATION_STORES = [
  "location_function_assignments",
  "organization_location_assignments",
  "organization_function_responsibilities",
  "process_location_assignments",
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
] as const satisfies readonly import("$lib/data/database").MutableRecordStoreName[];

const LOCATION_REFERENCE_FIELDS = new Set([
  "locationId",
  "siteId",
  "storageLocationId",
  "resolvedSiteId",
  "sourceLocationId",
  "targetLocationId",
]);

type LocationReferenceValue = string | string[] | null | undefined;

interface LocationDependencyRecord extends RecordEnvelope {
  status?: string;
  locationId?: LocationReferenceValue;
  siteId?: LocationReferenceValue;
  storageLocationId?: LocationReferenceValue;
  resolvedSiteId?: LocationReferenceValue;
  sourceLocationId?: LocationReferenceValue;
  targetLocationId?: LocationReferenceValue;
  processId?: string;
  taskId?: string;
  operationalFunctionId?: string;
  relationshipType?: string;
  resolvedCountryId?: string | null;
  resolvedStateOrProvinceId?: string | null;
  resolvedCountyOrDistrictId?: string | null;
  resolvedCityOrMunicipalityId?: string | null;
}

type LocationReclassificationPatch = Pick<FoundationLocation, "nodeType" | "resolvedSiteId">;

function reclassificationError(message: string) {
  return new AdamaDatabaseError(message, "LOCATION_RECLASSIFICATION_BLOCKED");
}

function isActive(record: LocationDependencyRecord) {
  return record.lifecycleStatus !== "archived" && record.status !== "archived";
}

function referencesLocation(record: LocationDependencyRecord, locationId: string) {
  return [...LOCATION_REFERENCE_FIELDS].some((field) => {
    const value = record[field as keyof LocationDependencyRecord];
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
          const dependencies = await session.listRecords<LocationDependencyRecord>(storeName);
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
        if (isOperationalLocation(nodeType) && !resolvedSiteId) {
          throw reclassificationError("The proposed Location type does not resolve to a valid Site.");
        }
        return session.updateRecord<FoundationLocation, LocationReclassificationPatch>({
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

export class LocationService extends FoundationService<Location> {
  constructor(
    repository: LocationRepository,
    private readonly processes: ProcessRepository,
    private readonly tasks: TaskRepository,
    options: FoundationServiceOptions,
  ) {
    super(repository, "LOC", "Location", options);
  }

  createCountry(input: Omit<LocationFields, "nodeType" | "parentId">) {
    return this.create({ ...input, nodeType: "Country", parentId: null });
  }

  createStateOrProvince(input: Omit<LocationFields, "nodeType"> & { parentId: string }) {
    return this.create({ ...input, nodeType: "StateOrProvince" });
  }

  /** @deprecated Use createStateOrProvince. */
  createStateOrRegion(input: Omit<LocationFields, "nodeType"> & { parentId: string }) {
    return this.createStateOrProvince(input);
  }

  createCountyOrDistrict(input: Omit<LocationFields, "nodeType"> & { parentId: string }) {
    return this.create({ ...input, nodeType: "CountyOrDistrict" });
  }

  createCityOrMunicipality(input: Omit<LocationFields, "nodeType"> & { parentId: string }) {
    return this.create({ ...input, nodeType: "CityOrMunicipality" });
  }

  createSite(input: Omit<LocationFields, "nodeType"> & { parentId: string }) {
    return this.create({ ...input, nodeType: "Site" });
  }

  createOperationalNode(
    input: Omit<LocationFields, "nodeType"> & { nodeType: Exclude<LocationNodeType, "Country" | "StateOrProvince" | "CountyOrDistrict" | "CityOrMunicipality" | "Site">; parentId: string },
  ) {
    return this.create(input);
  }

  async create(input: LocationFields) {
    assertValid(validateLocation(input));
    const id = this.options.createId?.() ?? crypto.randomUUID();
    const parent = await this.validateParent(input.nodeType, input.parentId || null);
    const resolved = resolveLocationAncestry(input.nodeType, id, parent);
    if (isOperationalLocation(input.nodeType) && !resolved.resolvedSiteId) {
      throw new ValidationError([{ field: "parentId", message: "Operational locations must resolve to exactly one Site.", code: "UNRESOLVED_SITE" }]);
    }
    return (this.repository as LocationRepository).createWithId(
      id,
      {
        businessId: await this.businessId(input.businessId),
        name: input.name.trim(),
        nodeType: input.nodeType,
        parentId: input.parentId || null,
        countryCode: input.countryCode?.trim().toUpperCase() ?? "",
        stateOrProvinceCode: input.stateOrProvinceCode?.trim().toUpperCase() ?? "",
        postalCode: input.postalCode?.trim() ?? "",
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        addressLine1: input.addressLine1?.trim() ?? "",
        addressLine2: input.addressLine2?.trim() ?? "",
        ...resolved,
        description: input.description?.trim() ?? "",
        status: input.status,
      },
      this.options.context(),
    );
  }

  async update(id: string, input: LocationFields, expectedRevision: number) {
    const current = await this.requireMutable(id);
    const merged = { ...current, ...input };
    assertValid(validateLocation(merged));
    if (merged.parentId === id) throw new CircularHierarchyError(id, id);
    if (merged.nodeType !== current.nodeType || merged.parentId !== current.parentId) {
      return this.moveNode(id, merged.parentId || null, expectedRevision, {
        name: merged.name,
        description: merged.description,
        status: merged.status,
        nodeType: merged.nodeType,
        countryCode: merged.countryCode?.trim().toUpperCase() ?? "",
        stateOrProvinceCode: merged.stateOrProvinceCode?.trim().toUpperCase() ?? "",
        postalCode: merged.postalCode?.trim() ?? "",
        latitude: merged.latitude ?? null,
        longitude: merged.longitude ?? null,
        addressLine1: merged.addressLine1?.trim() ?? "",
        addressLine2: merged.addressLine2?.trim() ?? "",
      });
    }
    return this.repository.update(
      id,
      {
        name: merged.name.trim(), description: merged.description?.trim() ?? "", status: merged.status,
        countryCode: merged.countryCode?.trim().toUpperCase() ?? "",
        stateOrProvinceCode: merged.stateOrProvinceCode?.trim().toUpperCase() ?? "",
        postalCode: merged.postalCode?.trim() ?? "",
        latitude: merged.latitude ?? null,
        longitude: merged.longitude ?? null,
        addressLine1: merged.addressLine1?.trim() ?? "",
        addressLine2: merged.addressLine2?.trim() ?? "",
      },
      expectedRevision,
      this.options.context(),
    );
  }

  async moveNode(
    id: string,
    parentId: string | null,
    expectedRevision: number,
    rootPatch: Partial<Pick<Location,
      "name" | "description" | "status" | "nodeType" | "countryCode" | "stateOrProvinceCode" |
      "postalCode" | "latitude" | "longitude" | "addressLine1" | "addressLine2"
    >> = {},
  ) {
    const root = await this.requireMutable(id);
    if (parentId === id) throw new CircularHierarchyError(id, id);
    const descendants = await (this.repository as LocationRepository).listDescendants(id, { includeArchived: true });
    if (parentId && descendants.some((location) => location.id === parentId)) {
      throw new CircularHierarchyError(id, parentId);
    }
    const nodeType = rootPatch.nodeType ?? root.nodeType;
    const nodeTypeChanged = nodeType !== root.nodeType;
    const parent = await this.validateParent(nodeType, parentId);
    const nextAncestryById = new Map<string, ResolvedLocationAncestry>();
    nextAncestryById.set(root.id, resolveLocationAncestry(nodeType, root.id, parent));

    const allLocations = await (this.repository as LocationRepository).list({ includeArchived: true });
    const locationById = new Map(allLocations.map((location) => [location.id, location]));

    if (nodeTypeChanged && descendants.length > 0) {
      throw new ValidationError([{
        field: "nodeType",
        message: "Location type cannot change while child Locations exist.",
        code: "LOCATION_RECLASSIFICATION_BLOCKED",
      }]);
    }

    for (const descendant of descendants) {
      const parentRecord = descendant.parentId ? locationById.get(descendant.parentId) ?? null : null;
      const parentAncestry = descendant.parentId ? nextAncestryById.get(descendant.parentId) : undefined;
      const effectiveParent = parentRecord && parentAncestry ? { ...parentRecord, ...parentAncestry } : parentRecord;
      nextAncestryById.set(descendant.id, resolveLocationAncestry(descendant.nodeType, descendant.id, effectiveParent));
    }

    if (isOperationalLocation(nodeType) && !nextAncestryById.get(root.id)?.resolvedSiteId) {
      throw new ValidationError([{ field: "parentId", message: "Operational locations must resolve to exactly one Site.", code: "UNRESOLVED_SITE" }]);
    }

    const movedLocationIds = new Set([root.id, ...descendants.map((location) => location.id)]);
    const activeProcesses = (await this.processes.list({ includeArchived: true })).filter(
      (process) => process.lifecycleStatus === "active",
    );
    if (nodeTypeChanged && activeProcesses.some((process) => process.primaryLocationId === root.id)) {
      throw new ValidationError([{
        field: "nodeType",
        message: "Location type cannot change while active Process dependencies exist.",
        code: "LOCATION_RECLASSIFICATION_BLOCKED",
      }]);
    }
    const processMutations = activeProcesses
      .filter((process) => movedLocationIds.has(process.primaryLocationId))
      .map((process) => ({
        record: process,
        resolvedSiteId: nextAncestryById.get(process.primaryLocationId)!.resolvedSiteId!,
      }));
    const processSiteById = new Map(
      activeProcesses.map((process) => [
        process.id,
        processMutations.find((mutation) => mutation.record.id === process.id)?.resolvedSiteId ?? process.resolvedSiteId,
      ]),
    );
    const activeTasks = (await this.tasks.list({ includeArchived: true })).filter(
      (task) => task.lifecycleStatus === "active",
    );
    if (nodeTypeChanged && activeTasks.some((task) => task.locationId === root.id)) {
      throw new ValidationError([{
        field: "nodeType",
        message: "Location type cannot change while active Task dependencies exist.",
        code: "LOCATION_RECLASSIFICATION_BLOCKED",
      }]);
    }
    const taskMutations = activeTasks
      .filter((task) => movedLocationIds.has(task.locationId) || processMutations.some((mutation) => mutation.record.id === task.processId))
      .map((task) => {
        const processSiteId = processSiteById.get(task.processId) ?? task.resolvedSiteId;
        const locationSiteId = movedLocationIds.has(task.locationId)
          ? nextAncestryById.get(task.locationId)?.resolvedSiteId
          : locationById.get(task.locationId)?.resolvedSiteId;
        if (!locationSiteId || processSiteId !== locationSiteId) {
          throw new CrossSiteRelationshipError("Task", processSiteId, locationSiteId ?? "an unresolved Site");
        }
        return { record: task, resolvedSiteId: processSiteId };
      });

    const processById = new Map(activeProcesses.map((process) => [process.id, process]));
    const effectiveProcessSite = (processId?: string) => {
      if (!processId) return null;
      return processSiteById.get(processId) ?? processById.get(processId)?.resolvedSiteId ?? null;
    };
    const ancestryForLocation = (locationId?: string | null) => {
      if (!locationId) return null;
      return nextAncestryById.get(locationId) ?? locationById.get(locationId) ?? null;
    };

    const dependencyRecords = new Map<string, LocationDependencyRecord[]>();
    for (const storeName of DEPENDENT_MUTATION_STORES) {
      dependencyRecords.set(
        storeName,
        await (this.repository as LocationRepository).listStoreRecords<LocationDependencyRecord>(storeName),
      );
    }
    if (nodeTypeChanged) {
      for (const [storeName, records] of dependencyRecords) {
        if (records.some((record) => isActive(record) && referencesLocation(record, root.id))) {
          throw new ValidationError([{
            field: "nodeType",
            message: `Location type cannot change while active ${storeName.replaceAll("_", " ")} dependencies exist.`,
            code: "LOCATION_RECLASSIFICATION_BLOCKED",
          }]);
        }
      }
    }
    const functionAssignments = (dependencyRecords.get("location_function_assignments") ?? []) as LocationFunctionAssignment[];
    const dependentMutations: LocationDependentMutation[] = [];

    for (const assignment of (dependencyRecords.get("process_location_assignments") ?? []) as ProcessLocationAssignment[]) {
      if (assignment.lifecycleStatus !== "active" || assignment.status !== "Active") continue;
      const processSiteId = effectiveProcessSite(assignment.processId);
      const locationSiteId = ancestryForLocation(assignment.locationId)?.resolvedSiteId ?? null;
      if (!processSiteId || processSiteId !== locationSiteId) {
        throw new CrossSiteRelationshipError("Process Location Assignment", processSiteId ?? "an unresolved Site", locationSiteId ?? "an unresolved Site");
      }
    }

    for (const [storeName, records] of dependencyRecords) {
      if (["location_function_assignments", "organization_location_assignments", "organization_function_responsibilities", "process_location_assignments"].includes(storeName)) continue;
      for (const record of records) {
        if (!isActive(record)) continue;
        const locationId = typeof record.locationId === "string" ? record.locationId
          : typeof record.storageLocationId === "string" ? record.storageLocationId
          : typeof record.siteId === "string" ? record.siteId
          : typeof record.sourceLocationId === "string" ? record.sourceLocationId
          : typeof record.targetLocationId === "string" ? record.targetLocationId
          : null;
        const locationMoved = Boolean(locationId && movedLocationIds.has(locationId));
        const processMoved = Boolean(record.processId && processMutations.some((mutation) => mutation.record.id === record.processId));
        if (!locationMoved && !processMoved) continue;
        const ancestry = ancestryForLocation(locationId);
        const locationSiteId = ancestry?.resolvedSiteId ?? null;
        const processSiteId = effectiveProcessSite(record.processId);
        if (record.processId && (!locationSiteId || !processSiteId || locationSiteId !== processSiteId)) {
          throw new CrossSiteRelationshipError(storeName.replaceAll("_", " "), processSiteId ?? "an unresolved Site", locationSiteId ?? "an unresolved Site");
        }
        if (storeName === "chemical_uses") {
          const process = record.processId ? processById.get(record.processId) : null;
          if (!process || !locationId || !locationSiteId) {
            throw new CrossSiteRelationshipError("Chemical Use", processSiteId ?? "an unresolved Site", locationSiteId ?? "an unresolved Site");
          }
          if (record.operationalFunctionId && record.operationalFunctionId !== process.operationalFunctionId) {
            throw new ValidationError([{ field: "operationalFunctionId", message: "Chemical Use Function must match its Process Function after the Location move.", code: "FUNCTION_MISMATCH" }]);
          }
          const compatible = functionAssignments.some((assignment) =>
            assignment.locationId === locationId && assignment.operationalFunctionId === process.operationalFunctionId && assignmentIsEffective(assignment));
          if (!compatible) {
            throw new ValidationError([{ field: "locationId", message: "Chemical Use Location lacks the active Process Function assignment after the move.", code: "LOCATION_FUNCTION_REQUIRED" }]);
          }
        }
        if (storeName === "exposure_scenarios" && record.operationalFunctionId) {
          const process = record.processId ? processById.get(record.processId) : null;
          if (process && process.operationalFunctionId !== record.operationalFunctionId) {
            throw new ValidationError([{ field: "operationalFunctionId", message: "Exposure Scenario Function must match its Process Function after the Location move.", code: "FUNCTION_MISMATCH" }]);
          }
          if (!locationId || !functionAssignments.some((assignment) =>
            assignment.locationId === locationId && assignment.operationalFunctionId === record.operationalFunctionId && assignmentIsEffective(assignment))) {
            throw new ValidationError([{ field: "locationId", message: "Exposure Scenario Location lacks the active Operational Function assignment after the move.", code: "LOCATION_FUNCTION_REQUIRED" }]);
          }
        }
        const patch: LocationDependentMutation["patch"] = {};
        if ("siteId" in record && locationSiteId) patch.siteId = locationSiteId;
        if ("resolvedSiteId" in record && locationSiteId) patch.resolvedSiteId = locationSiteId;
        if ("resolvedCountryId" in record) patch.resolvedCountryId = ancestry?.resolvedCountryId ?? null;
        if ("resolvedStateOrProvinceId" in record) patch.resolvedStateOrProvinceId = ancestry?.resolvedStateOrProvinceId ?? null;
        if ("resolvedCountyOrDistrictId" in record) patch.resolvedCountyOrDistrictId = ancestry?.resolvedCountyOrDistrictId ?? null;
        if ("resolvedCityOrMunicipalityId" in record) patch.resolvedCityOrMunicipalityId = ancestry?.resolvedCityOrMunicipalityId ?? null;
        if (storeName === "chemical_uses" && record.processId) {
          patch.operationalFunctionId = processById.get(record.processId)!.operationalFunctionId;
        }
        if (Object.keys(patch).length) {
          dependentMutations.push({ storeName: storeName as import("$lib/data/database").MutableRecordStoreName, recordType: storeName, record, patch });
        }
      }
    }

    const changed = await (this.repository as LocationRepository).updateHierarchy(
      [
        {
          record: root,
          expectedRevision,
          patch: {
            parentId,
            ...nextAncestryById.get(root.id)!,
            ...rootPatch,
          },
        },
        ...descendants.map((record) => ({
          record,
          patch: { ...nextAncestryById.get(record.id)! },
        })),
      ],
      processMutations,
      taskMutations,
      dependentMutations,
      this.options.context(),
    );
    return changed[0] as Location;
  }

  resolveSite(id: string) {
    return this.get(id, true).then((location) => location.resolvedSiteId);
  }

  listChildren(id: string, includeArchived = false) {
    return (this.repository as LocationRepository).listChildren(id, { includeArchived });
  }

  listDescendants(id: string, includeArchived = false) {
    return (this.repository as LocationRepository).listDescendants(id, { includeArchived });
  }

  async breadcrumb(id: string) {
    const path: Location[] = [];
    let current: Location | null = await this.get(id, true);
    const seen = new Set<string>();
    while (current) {
      if (seen.has(current.id)) throw new CircularHierarchyError(id, current.id);
      seen.add(current.id);
      path.unshift(current);
      current = current.parentId ? await this.get(current.parentId, true) : null;
    }
    return path;
  }

  private async validateParent(nodeType: LocationNodeType, parentId: string | null) {
    if (nodeType === "Country") {
      if (parentId) throw new InvalidParentTypeError(nodeType, null);
      return null;
    }
    if (!parentId) throw new InvalidParentTypeError(nodeType, null);
    const parent = await this.requireActiveRelationship(this.repository, parentId, "parentId");
    if (!LOCATION_PARENT_TYPES[nodeType].includes(parent.nodeType)) {
      throw new InvalidParentTypeError(nodeType, parent.nodeType);
    }
    return parent;
  }

  private resolveFromParent(nodeType: LocationNodeType, id: string, parent: Location | null) {
    return resolveSiteForLocation(nodeType, id, parent);
  }

  protected title(record: Location) {
    return record.name;
  }
}
