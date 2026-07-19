import {
  AdamaDatabaseError,
  AdamaIndexedDbAdapter,
  StorageUnavailableError,
  type DatabaseIdentity,
  type OpenIndexedDbAdapterOptions,
} from "$lib/data/database";
import {
  LocationRepository,
  OrganizationRepository,
  PersonRepository,
  ProcessRepository,
  TaskRepository,
} from "$lib/data/repositories/foundation";
import { RevisionRepository } from "$lib/data/revisions";
import { LocationService } from "./location-service";
import { OrganizationService } from "./organization-service";
import { PersonService } from "./person-service";
import { ProcessService } from "./process-service";
import { TaskService } from "./task-service";
import { DatabaseUnavailableError } from "$lib/domain/foundation";

export interface FoundationServices {
  organizations: OrganizationService;
  people: PersonService;
  locations: LocationService;
  processes: ProcessService;
  tasks: TaskService;
}

export interface FoundationApplicationOptions extends OpenIndexedDbAdapterOptions {
  createId?: () => string;
}

export class FoundationApplication {
  private adapter: AdamaIndexedDbAdapter | null = null;
  private identity: DatabaseIdentity | null = null;
  private serviceSet: FoundationServices | null = null;
  private initialization: Promise<FoundationServices> | null = null;

  constructor(private readonly options: FoundationApplicationOptions = {}) {}

  initialize() {
    if (this.serviceSet) return Promise.resolve(this.serviceSet);
    if (this.initialization) return this.initialization;
    this.initialization = this.open();
    return this.initialization;
  }

  async services() {
    return this.initialize();
  }

  async revisionHistory<T>(recordType: string, recordId: string) {
    await this.initialize();
    return new RevisionRepository(this.adapter!.database).listForRecord<T>(recordType, recordId);
  }

  async databaseIdentity() {
    await this.initialize();
    const identity = await this.adapter!.identity();
    if (!identity) throw new Error("IndexedDB identity is unavailable.");
    this.identity = identity;
    return identity;
  }

  close() {
    this.adapter?.close();
    this.adapter = null;
    this.identity = null;
    this.serviceSet = null;
    this.initialization = null;
  }

  private async open() {
    try {
      const identityOptions = this.options.identity ?? {
        actorId: "local-hse-user",
        actorBusinessId: "PER-LOCAL",
        actorDisplayName: "Local HSE User",
        installationLabel: "ADAMA HSE browser",
      };
      const adapter = await AdamaIndexedDbAdapter.open({ ...this.options, identity: identityOptions });
      const identity = await adapter.identity();
      if (!identity) throw new Error("IndexedDB identity initialization did not complete.");
      this.adapter = adapter;
      this.identity = identity;

      const organizations = new OrganizationRepository(adapter.database);
      const people = new PersonRepository(adapter.database);
      const locations = new LocationRepository(adapter.database);
      const processes = new ProcessRepository(adapter.database);
      const tasks = new TaskRepository(adapter.database);
      const serviceOptions = {
        context: () => ({
          actorId: identity.localUser.id,
          installationId: identity.installation.installationId,
          source: "local" as const,
        }),
        createId: this.options.createId,
      };

      this.serviceSet = {
        organizations: new OrganizationService(organizations, people, serviceOptions),
        people: new PersonService(people, organizations, locations, serviceOptions),
        locations: new LocationService(locations, processes, tasks, serviceOptions),
        processes: new ProcessService(processes, locations, serviceOptions),
        tasks: new TaskService(tasks, processes, locations, serviceOptions),
      };
      return this.serviceSet;
    } catch (error) {
      this.initialization = null;
      if (
        error instanceof StorageUnavailableError ||
        (error instanceof AdamaDatabaseError && error.code === "DATABASE_BLOCKED")
      ) {
        throw new DatabaseUnavailableError(error);
      }
      throw error;
    }
  }
}

export const foundationApplication = new FoundationApplication();
