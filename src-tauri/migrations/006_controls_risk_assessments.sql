CREATE TABLE IF NOT EXISTS controls (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  hazardIds TEXT NOT NULL DEFAULT '[]',
  description TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  verificationMethod TEXT NOT NULL DEFAULT '',
  verificationFrequency TEXT NOT NULL DEFAULT '',
  lastVerifiedAt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  hazardId TEXT NOT NULL,
  controlIds TEXT NOT NULL DEFAULT '[]',
  inherentSeverity TEXT NOT NULL,
  inherentLikelihood TEXT NOT NULL,
  residualSeverity TEXT NOT NULL,
  residualLikelihood TEXT NOT NULL,
  assessor TEXT NOT NULL DEFAULT '',
  reviewStatus TEXT NOT NULL,
  nextReviewDate TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  archivedAt TEXT,
  archivedReason TEXT,
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_controls_lifecycle ON controls(lifecycleStatus);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_lifecycle ON risk_assessments(lifecycleStatus);
