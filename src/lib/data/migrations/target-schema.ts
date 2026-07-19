import {
  ADAMA_DATABASE_VERSION,
  createInitialAdamaSchema,
  upgradeFoundationHardeningSchema,
} from "../database/schema";

export interface TargetSchemaMigration {
  version: number;
  description: string;
  apply(database: IDBDatabase, transaction: IDBTransaction): void;
}

export const TARGET_SCHEMA_MIGRATIONS: readonly TargetSchemaMigration[] = [
  {
    version: 1,
    description:
      "Create bounded system, foundation, industrial-hygiene, assurance, and governance stores with required indexes.",
    apply: createInitialAdamaSchema,
  },
  {
    version: 2,
    description:
      "Add local-profile identity, typed foundation relationship, and canonical chemical relationship indexes without rewriting existing records.",
    apply: upgradeFoundationHardeningSchema,
  },
] as const;

export function upgradeAdamaDatabase(
  database: IDBDatabase,
  transaction: IDBTransaction,
  oldVersion: number,
) {
  const targetVersion = database.version;
  if (targetVersion > ADAMA_DATABASE_VERSION) {
    throw new Error(
      `Database target version ${targetVersion} is newer than supported version ${ADAMA_DATABASE_VERSION}.`,
    );
  }
  for (const migration of TARGET_SCHEMA_MIGRATIONS) {
    if (migration.version > oldVersion && migration.version <= targetVersion) {
      migration.apply(database, transaction);
    }
  }
}
