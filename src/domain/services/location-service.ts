import {
  validateLocationInput,
  type LocationInput,
  type LocationRecord,
} from "$lib/persistence/location.types";
import type { RegisterRepository, TransactionCoordinator } from "../contracts";
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
}
