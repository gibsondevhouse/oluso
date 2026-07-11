ALTER TABLE findings ADD COLUMN activityDate TEXT NOT NULL DEFAULT '';
ALTER TABLE findings ADD COLUMN equipmentId TEXT NOT NULL DEFAULT '';
ALTER TABLE findings ADD COLUMN chemicalId TEXT NOT NULL DEFAULT '';
ALTER TABLE findings ADD COLUMN controlId TEXT NOT NULL DEFAULT '';
ALTER TABLE findings ADD COLUMN scope TEXT NOT NULL DEFAULT '';
ALTER TABLE findings ADD COLUMN criteriaReference TEXT NOT NULL DEFAULT '';
ALTER TABLE findings ADD COLUMN evidenceReference TEXT NOT NULL DEFAULT '';
ALTER TABLE findings ADD COLUMN followUpRequired INTEGER NOT NULL DEFAULT 0;
ALTER TABLE findings ADD COLUMN notes TEXT NOT NULL DEFAULT '';

UPDATE findings
SET activityDate = substr(createdAt, 1, 10)
WHERE activityDate = '';

CREATE TABLE IF NOT EXISTS exposure_monitoring (
  id TEXT PRIMARY KEY,
  sampleReference TEXT NOT NULL,
  contextType TEXT NOT NULL,
  segId TEXT NOT NULL DEFAULT '',
  contextDetail TEXT NOT NULL DEFAULT '',
  contaminant TEXT NOT NULL,
  chemicalId TEXT NOT NULL DEFAULT '',
  hazardId TEXT NOT NULL DEFAULT '',
  locationId TEXT NOT NULL,
  processId TEXT NOT NULL DEFAULT '',
  samplingDate TEXT NOT NULL,
  sampleType TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  exposureLimit TEXT NOT NULL DEFAULT '',
  exposureLimitReference TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  evidenceReference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  occurredAt TEXT NOT NULL,
  locationId TEXT NOT NULL,
  processId TEXT NOT NULL DEFAULT '',
  equipmentId TEXT NOT NULL DEFAULT '',
  chemicalId TEXT NOT NULL DEFAULT '',
  hazardIds TEXT NOT NULL DEFAULT '[]',
  controlIds TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL DEFAULT '',
  actualOutcome TEXT NOT NULL DEFAULT '',
  potentialOutcome TEXT NOT NULL DEFAULT '',
  immediateActions TEXT NOT NULL DEFAULT '',
  investigationSummary TEXT NOT NULL DEFAULT '',
  immediateCauses TEXT NOT NULL DEFAULT '',
  contributingCauses TEXT NOT NULL DEFAULT '',
  evidenceReference TEXT NOT NULL DEFAULT '',
  reportingStatus TEXT NOT NULL,
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS compliance_items (
  id TEXT PRIMARY KEY,
  itemType TEXT NOT NULL,
  title TEXT NOT NULL,
  requirementSource TEXT NOT NULL,
  owner TEXT NOT NULL,
  audienceOrScope TEXT NOT NULL DEFAULT '',
  segId TEXT NOT NULL DEFAULT '',
  locationId TEXT NOT NULL DEFAULT '',
  processId TEXT NOT NULL DEFAULT '',
  equipmentId TEXT NOT NULL DEFAULT '',
  issueDate TEXT NOT NULL DEFAULT '',
  dueDate TEXT NOT NULL DEFAULT '',
  expirationDate TEXT NOT NULL DEFAULT '',
  reviewDate TEXT NOT NULL DEFAULT '',
  recurrence TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  reviewStatus TEXT NOT NULL,
  evidenceRequired INTEGER NOT NULL DEFAULT 0,
  evidenceReference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_exposure_monitoring_lifecycle ON exposure_monitoring(lifecycleStatus);
CREATE INDEX IF NOT EXISTS idx_incidents_lifecycle ON incidents(lifecycleStatus);
CREATE INDEX IF NOT EXISTS idx_compliance_items_lifecycle ON compliance_items(lifecycleStatus);
