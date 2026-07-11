CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  locationId TEXT NOT NULL,
  processId TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_equipment_lifecycle ON equipment(lifecycleStatus);
