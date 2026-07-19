import { AdamaIndexedDbAdapter } from "./indexeddb-adapter";

let adapterPromise: Promise<AdamaIndexedDbAdapter> | null = null;

export function getBrowserDatabase() {
  adapterPromise ??= AdamaIndexedDbAdapter.open().catch((error) => {
    adapterPromise = null;
    throw error;
  });
  return adapterPromise;
}
