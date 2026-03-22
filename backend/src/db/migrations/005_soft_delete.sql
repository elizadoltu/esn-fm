-- Soft delete support for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Change answers author FK from CASCADE to SET NULL so answers survive account deletion
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_author_id_fkey;
ALTER TABLE answers ADD CONSTRAINT answers_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

-- Index for filtering out deleted users
CREATE INDEX IF NOT EXISTS users_is_deleted_idx ON users(is_deleted) WHERE is_deleted = FALSE;
