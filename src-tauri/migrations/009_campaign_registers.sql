CREATE TABLE IF NOT EXISTS campaign_records (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  businessId TEXT NOT NULL,
  payload TEXT NOT NULL,
  lifecycleStatus TEXT NOT NULL DEFAULT 'active',
  updatedAt TEXT NOT NULL,
  PRIMARY KEY (collection, id),
  UNIQUE (collection, businessId),
  CHECK (lifecycleStatus IN ('active', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_campaign_records_collection_lifecycle
  ON campaign_records(collection, lifecycleStatus);
