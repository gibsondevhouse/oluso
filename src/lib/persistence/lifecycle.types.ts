export type LifecycleStatus = "active" | "archived";

export interface LifecycleMetadata {
  archivedAt: string | null;
  archivedReason: string | null;
  lifecycleStatus: LifecycleStatus;
}

export const ACTIVE_LIFECYCLE: LifecycleMetadata = {
  archivedAt: null,
  archivedReason: null,
  lifecycleStatus: "active",
};

export function withActiveLifecycle<TRecord extends object>(
  record: TRecord,
): TRecord & LifecycleMetadata {
  return {
    ...record,
    ...ACTIVE_LIFECYCLE,
  };
}

export function ensureLifecycle<TRecord extends object>(
  record: TRecord,
): TRecord & LifecycleMetadata {
  const maybeRecord = record as Partial<LifecycleMetadata>;

  return {
    ...record,
    archivedAt: maybeRecord.archivedAt ?? null,
    archivedReason: maybeRecord.archivedReason ?? null,
    lifecycleStatus: maybeRecord.lifecycleStatus === "archived" ? "archived" : "active",
  };
}

export function isActiveLifecycle(record: LifecycleMetadata): boolean {
  return record.lifecycleStatus !== "archived";
}
