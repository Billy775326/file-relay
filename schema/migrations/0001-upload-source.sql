-- Existing D1 databases only. Apply once before deploying the new code.
ALTER TABLE shares ADD COLUMN source_json TEXT;
ALTER TABLE upload_sessions ADD COLUMN source_json TEXT;
CREATE TABLE IF NOT EXISTS visitor_notes (
  visitor_id TEXT PRIMARY KEY,
  note TEXT NOT NULL
);
