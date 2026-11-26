-- Additive: existing shares and sessions remain single-file records.
ALTER TABLE shares ADD COLUMN files_json TEXT;
ALTER TABLE shares ADD COLUMN draft_until INTEGER;
ALTER TABLE upload_sessions ADD COLUMN batch_code TEXT;
CREATE INDEX IF NOT EXISTS idx_shares_draft ON shares(draft_until) WHERE draft_until IS NOT NULL;
