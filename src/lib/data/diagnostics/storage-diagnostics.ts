export interface StorageDiagnostics {
  indexedDbAvailable: boolean;
  serviceWorkerSupported: boolean;
  storageEstimateSupported: boolean;
  persistenceRequestSupported: boolean;
  persisted: boolean | null;
  usageBytes: number | null;
  quotaBytes: number | null;
  usageRatio: number | null;
  risk: "unknown" | "healthy" | "warning" | "critical";
}

export async function inspectBrowserStorage(): Promise<StorageDiagnostics> {
  const storage = typeof navigator !== "undefined" ? navigator.storage : undefined;
  const estimate = storage?.estimate ? await storage.estimate() : undefined;
  const persisted = storage?.persisted ? await storage.persisted() : null;
  const usageBytes = estimate?.usage ?? null;
  const quotaBytes = estimate?.quota ?? null;
  const usageRatio = usageBytes !== null && quotaBytes ? usageBytes / quotaBytes : null;
  const risk =
    usageRatio === null
      ? "unknown"
      : usageRatio >= 0.9
        ? "critical"
        : usageRatio >= 0.75
          ? "warning"
          : "healthy";

  return {
    indexedDbAvailable: typeof indexedDB !== "undefined",
    serviceWorkerSupported:
      typeof navigator !== "undefined" && "serviceWorker" in navigator,
    storageEstimateSupported: Boolean(storage?.estimate),
    persistenceRequestSupported: Boolean(storage?.persist),
    persisted,
    usageBytes,
    quotaBytes,
    usageRatio,
    risk,
  };
}

export async function requestPersistentStorage() {
  const storage = typeof navigator !== "undefined" ? navigator.storage : undefined;
  if (!storage?.persist) return false;
  return storage.persist();
}
