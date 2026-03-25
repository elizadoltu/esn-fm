-- Migration 013: V4 admin features
-- Adds: is_anonymous on questions, audit_logs, moderation_email_digest on users,
--        moderation_alert notification type, moderation_email_batches

-- ── Anonymous flag on questions ───────────────────────────────────────────────
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Audit logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_admin_idx   ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);

-- ── Moderation email preference for admin/moderator accounts ──────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS moderation_email_digest BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Add moderation_alert to notification type check ───────────────────────────
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_question', 'new_like', 'new_comment', 'new_reply',
    'new_follower', 'new_answer', 'new_dm', 'follow_request',
    'moderation_alert'
  ));

-- ── Moderation email batch tracking (5-min dedup per content) ─────────────────
CREATE TABLE IF NOT EXISTS moderation_email_batches (
  content_id    UUID        NOT NULL PRIMARY KEY,
  last_sent_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  batch_count   INT         NOT NULL DEFAULT 1
);
