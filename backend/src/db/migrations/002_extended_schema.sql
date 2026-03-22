-- Migration 002: Extended schema for full MVP
-- Adds: new user columns, show_in_feed on questions,
--        comments, notifications, reports, blocks, direct_messages

-- ── Users enhancements ────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS location            TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS website             TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cover_image_url     TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_private          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS role                TEXT DEFAULT 'user'
                                                 CHECK (role IN ('user', 'moderator', 'admin')),
  ADD COLUMN IF NOT EXISTS username_changed_at TIMESTAMPTZ DEFAULT NULL;

-- ── Questions enhancements ────────────────────────────────────────────────────
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS show_in_feed BOOLEAN DEFAULT TRUE;

-- ── Comments ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id         UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id)        ON DELETE CASCADE,
  content           TEXT NOT NULL CHECK (char_length(content) <= 200),
  is_deleted        BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_answer_idx  ON comments(answer_id);
CREATE INDEX IF NOT EXISTS comments_parent_idx  ON comments(parent_comment_id);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES users(id)          ON DELETE SET NULL,
  type         TEXT NOT NULL
                 CHECK (type IN ('new_question','new_like','new_comment','new_reply','new_follower')),
  reference_id UUID,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications(recipient_id, is_read);

-- ── Reports ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL
                 CHECK (content_type IN ('question','answer','comment','user')),
  content_id   UUID NOT NULL,
  reason       TEXT NOT NULL
                 CHECK (reason IN ('spam','harassment','hate_speech','inappropriate','other')),
  status       TEXT DEFAULT 'pending'
                 CHECK (status IN ('pending','reviewed','actioned')),
  reviewer_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ DEFAULT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status, created_at DESC);

-- ── Blocks ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- ── Direct Messages ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS direct_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (char_length(content) <= 500),
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dm_conversation_idx
  ON direct_messages(
    LEAST(sender_id, recipient_id),
    GREATEST(sender_id, recipient_id),
    created_at DESC
  );
