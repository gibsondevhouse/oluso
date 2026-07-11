CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS migration_log (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  error TEXT
);

CREATE TABLE IF NOT EXISTS persistence_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS processes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  locationId TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS chemicals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  casNumber TEXT NOT NULL DEFAULT '',
  hazardClass TEXT NOT NULL,
  processIds TEXT NOT NULL DEFAULT '[]',
  storageLocationId TEXT NOT NULL,
  quantity TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  supplier TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS hazards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  locationId TEXT NOT NULL,
  locationIds TEXT NOT NULL DEFAULT '[]',
  processIds TEXT NOT NULL DEFAULT '[]',
  chemicalIds TEXT NOT NULL DEFAULT '[]',
  severity TEXT NOT NULL,
  likelihood TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  controls TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS segs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  locationId TEXT NOT NULL,
  processId TEXT NOT NULL DEFAULT '',
  chemicalIds TEXT NOT NULL DEFAULT '[]',
  hazardIds TEXT NOT NULL DEFAULT '[]',
  agentType TEXT NOT NULL,
  exposureLevel TEXT NOT NULL,
  workerCount TEXT NOT NULL DEFAULT '',
  controls TEXT NOT NULL DEFAULT '',
  monitoringFrequency TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  locationId TEXT NOT NULL,
  processId TEXT NOT NULL DEFAULT '',
  hazardId TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  reportedBy TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS corrective_actions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  findingId TEXT NOT NULL,
  assignedTo TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  dueDate TEXT NOT NULL,
  closedAt TEXT,
  closureNotes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_locations_lifecycle ON locations(lifecycleStatus);
CREATE INDEX IF NOT EXISTS idx_processes_lifecycle ON processes(lifecycleStatus);
CREATE INDEX IF NOT EXISTS idx_chemicals_lifecycle ON chemicals(lifecycleStatus);
CREATE INDEX IF NOT EXISTS idx_hazards_lifecycle ON hazards(lifecycleStatus);
CREATE INDEX IF NOT EXISTS idx_segs_lifecycle ON segs(lifecycleStatus);
CREATE INDEX IF NOT EXISTS idx_findings_lifecycle ON findings(lifecycleStatus);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_lifecycle ON corrective_actions(lifecycleStatus);
