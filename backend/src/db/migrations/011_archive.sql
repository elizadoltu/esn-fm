-- Add is_archived flag to answers (hides answered Q&As from public feeds)
ALTER TABLE answers ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_archived flag to questions (hides unanswered questions from inbox)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
