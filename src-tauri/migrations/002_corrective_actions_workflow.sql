ALTER TABLE corrective_actions ADD COLUMN sourceType TEXT NOT NULL DEFAULT 'Finding';
ALTER TABLE corrective_actions ADD COLUMN sourceId TEXT NOT NULL DEFAULT '';
ALTER TABLE corrective_actions ADD COLUMN sourceJustification TEXT NOT NULL DEFAULT '';
ALTER TABLE corrective_actions ADD COLUMN completionSummary TEXT NOT NULL DEFAULT '';
ALTER TABLE corrective_actions ADD COLUMN completedAt TEXT;
ALTER TABLE corrective_actions ADD COLUMN verificationRequired INTEGER NOT NULL DEFAULT 1;
ALTER TABLE corrective_actions ADD COLUMN verificationMethod TEXT NOT NULL DEFAULT '';
ALTER TABLE corrective_actions ADD COLUMN verificationResult TEXT NOT NULL DEFAULT '';
ALTER TABLE corrective_actions ADD COLUMN verifiedAt TEXT;

UPDATE corrective_actions
SET
  sourceType = 'Finding',
  sourceId = findingId,
  status = CASE
    WHEN status = 'Open' THEN 'Created'
    ELSE status
  END
WHERE sourceId = '';
