import { LocationRepository, ProcessRepository, TaskRepository } from "$lib/data/repositories/foundation";
import {
  CircularHierarchyError,
  CrossSiteRelationshipError,
  InvalidParentTypeError,
  LOCATION_PARENT_TYPES,
  ValidationError,
  assertValid,
  isOperationalLocation,
  validateLocation,
  type Location,
  type LocationFields,
  type LocationNodeType,
} from "$lib/domain/foundation";
import { FoundationService, type FoundationServiceOptions } from "./foundation-service";

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

  createStateOrRegion(input: Omit<LocationFields, "nodeType"> & { parentId: string }) {
    return this.create({ ...input, nodeType: "StateOrRegion" });
  }

  createSite(input: Omit<LocationFields, "nodeType"> & { parentId: string }) {
    return this.create({ ...input, nodeType: "Site" });
  }

  createOperationalNode(
    input: Omit<LocationFields, "nodeType"> & { nodeType: Exclude<LocationNodeType, "Country" | "StateOrRegion" | "Site">; parentId: string },
  ) {
    return this.create(input);
  }

  async create(input: LocationFields) {
    assertValid(validateLocation(input));
    const id = this.options.createId?.() ?? crypto.randomUUID();
    const parent = await this.validateParent(input.nodeType, input.parentId || null);
    const resolvedSiteId = this.resolveFromParent(input.nodeType, id, parent);
    if (isOperationalLocation(input.nodeType) && !resolvedSiteId) {
      throw new ValidationError([{ field: "parentId", message: "Operational locations must resolve to exactly one Site.", code: "UNRESOLVED_SITE" }]);
    }
    return (this.repository as LocationRepository).createWithId(
      id,
      {
        businessId: await this.businessId(input.businessId),
        name: input.name.trim(),
        nodeType: input.nodeType,
        parentId: input.parentId || null,
        resolvedSiteId,
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
      });
    }
    return this.repository.update(
      id,
      { name: merged.name.trim(), description: merged.description?.trim() ?? "", status: merged.status },
      expectedRevision,
      this.options.context(),
    );
  }

  async moveNode(
    id: string,
    parentId: string | null,
    expectedRevision: number,
    rootPatch: Partial<Pick<Location, "name" | "description" | "status" | "nodeType">> = {},
  ) {
    const root = await this.requireMutable(id);
    if (parentId === id) throw new CircularHierarchyError(id, id);
    const descendants = await (this.repository as LocationRepository).listDescendants(id, { includeArchived: true });
    if (parentId && descendants.some((location) => location.id === parentId)) {
      throw new CircularHierarchyError(id, parentId);
    }
    const nodeType = rootPatch.nodeType ?? root.nodeType;
    const parent = await this.validateParent(nodeType, parentId);
    const nextRoot = { ...root, ...rootPatch, nodeType, parentId };
    const nextSiteById = new Map<string, string | null>();
    nextSiteById.set(root.id, this.resolveFromParent(nodeType, root.id, parent));

    for (const descendant of descendants) {
      const parentSite = descendant.parentId === root.id
        ? nextSiteById.get(root.id) ?? null
        : nextSiteById.get(descendant.parentId ?? "") ?? descendant.resolvedSiteId;
      nextSiteById.set(
        descendant.id,
        descendant.nodeType === "Site"
          ? descendant.id
          : isOperationalLocation(descendant.nodeType)
            ? parentSite
            : null,
      );
    }

    if (isOperationalLocation(nodeType) && !nextSiteById.get(root.id)) {
      throw new ValidationError([{ field: "parentId", message: "Operational locations must resolve to exactly one Site.", code: "UNRESOLVED_SITE" }]);
    }

    const movedLocationIds = new Set([root.id, ...descendants.map((location) => location.id)]);
    const allLocations = await (this.repository as LocationRepository).list({ includeArchived: true });
    const locationById = new Map(allLocations.map((location) => [location.id, location]));
    const activeProcesses = (await this.processes.list({ includeArchived: true })).filter(
      (process) => process.lifecycleStatus === "active",
    );
    const processMutations = activeProcesses
      .filter((process) => movedLocationIds.has(process.primaryLocationId))
      .map((process) => ({
        record: process,
        resolvedSiteId: nextSiteById.get(process.primaryLocationId)!,
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
    const taskMutations = activeTasks
      .filter((task) => movedLocationIds.has(task.locationId) || processMutations.some((mutation) => mutation.record.id === task.processId))
      .map((task) => {
        const processSiteId = processSiteById.get(task.processId) ?? task.resolvedSiteId;
        const locationSiteId = movedLocationIds.has(task.locationId)
          ? nextSiteById.get(task.locationId)
          : locationById.get(task.locationId)?.resolvedSiteId;
        if (!locationSiteId || processSiteId !== locationSiteId) {
          throw new CrossSiteRelationshipError("Task", processSiteId, locationSiteId ?? "an unresolved Site");
        }
        return { record: task, resolvedSiteId: processSiteId };
      });

    const changed = await (this.repository as LocationRepository).updateHierarchy(
      [
        {
          record: root,
          expectedRevision,
          patch: {
            parentId,
            resolvedSiteId: nextSiteById.get(root.id) ?? null,
            ...rootPatch,
          },
        },
        ...descendants.map((record) => ({
          record,
          patch: { resolvedSiteId: nextSiteById.get(record.id) ?? null },
        })),
      ],
      processMutations,
      taskMutations,
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
    if (nodeType === "Site") return id;
    if (!isOperationalLocation(nodeType)) return null;
    return parent?.nodeType === "Site" ? parent.id : parent?.resolvedSiteId ?? null;
  }

  protected title(record: Location) {
    return record.name;
  }
}
