import {
  validateLocationInput,
  type LocationInput,
  type LocationRecord,
} from "$lib/persistence/location.types";
import type { RegisterRepository, TransactionCoordinator } from "../contracts";
import { RelationshipError } from "../errors";
import { BaseRegisterService } from "./base-register-service";

export class LocationService extends BaseRegisterService<LocationRecord, LocationInput> {
  constructor(
    repository: RegisterRepository<LocationRecord, LocationInput>,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Location", transactionCoordinator);
  }

  protected validateInput(input: LocationInput) {
    return validateLocationInput(input).errors;
  }

  protected validateRelationships(input: LocationInput, existingId?: string) {
    const parentLocationId = input.parentLocationId?.trim() ?? "";

    if (!parentLocationId) {
      return;
    }

    const currentId = existingId ?? (input as LocationInput & { id?: string }).id?.trim() ?? "";

    if (currentId && parentLocationId === currentId) {
      throw new RelationshipError("Parent location cannot be the same location.");
    }

    const parent = this.repository.getById(parentLocationId);

    if (!parent) {
      throw new RelationshipError("Parent location was not found.");
    }

    if (parent.lifecycleStatus === "archived" || parent.status !== "active") {
      throw new RelationshipError("Parent location must be an active location.");
    }

    const visited = new Set<string>(currentId ? [currentId] : []);
    let ancestor: LocationRecord | null = parent;

    while (ancestor?.parentLocationId) {
      if (visited.has(ancestor.parentLocationId)) {
        throw new RelationshipError("Parent location cannot create a circular hierarchy.");
      }

      visited.add(ancestor.id);
      ancestor = this.repository.getById(ancestor.parentLocationId);
    }
  }
}
