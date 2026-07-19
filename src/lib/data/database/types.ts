import type { CurrentRecordStoreName } from "./schema";

export type LifecycleStatus = "active" | "archived";
export type MutationSource = "local" | "migration" | "exchange" | "rollback";

export interface RecordEnvelope {
  id: string;
  businessId: string;
  revision: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  originInstallationId: string;
  lastExchangePackageId?: string;
  lifecycleStatus: LifecycleStatus;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
}

export type RecordRevisionOperation =
  | "create"
  | "update"
  | "archive"
  | "restore"
  | "supersede"
  | "import"
  | "resolve"
  | "tombstone";

export interface RecordRevision<T = unknown> {
  id: string;
  recordType: string;
  recordId: string;
  revision: number;
  operation: RecordRevisionOperation;
  changedAt: string;
  changedBy: string;
  changedInstallationId: string;
  source: MutationSource;
  changeReason?: string;
  before?: T;
  after?: T;
  exchangePackageId?: string;
}

export interface MutationContext {
  actorId: string;
  installationId: string;
  source: MutationSource;
  reason?: string;
  exchangePackageId?: string;
}

export interface DatasetMetadata {
  id: "current";
  datasetId: string;
  schemaVersion: number;
  datasetRevision: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface InstallationMetadata {
  id: "current";
  installationId: string;
  createdAt: string;
  updatedAt: string;
  label: string;
}

export interface LocalUserProfile {
  id: string;
  businessId: string;
  displayName: string;
  role:
    | "HSE Coordinator"
    | "HSE Manager"
    | "Site Manager"
    | "Plant Manager"
    | "Reviewer"
    | "Industrial Hygienist"
    | "Administrator"
    | "Other";
  initials: string;
  employeeIdentifier?: string;
  email?: string;
  installationId: string;
  isCurrentForInstallation: boolean;
  personId?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseIdentity {
  dataset: DatasetMetadata;
  installation: InstallationMetadata;
  localUser: LocalUserProfile;
}

export interface RecordMutationDescriptor<TRecord extends RecordEnvelope = RecordEnvelope> {
  storeName: CurrentRecordStoreName;
  recordType: string;
  record: TRecord;
}
