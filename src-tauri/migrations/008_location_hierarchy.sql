ALTER TABLE locations ADD COLUMN parentLocationId TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parentLocationId);
