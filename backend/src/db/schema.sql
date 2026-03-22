-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     TEXT UNIQUE NOT NULL,
  username                  TEXT UNIQUE NOT NULL,
  password_hash             TEXT NOT NULL,
  display_name              TEXT NOT NULL,
  bio                       TEXT DEFAULT '',
  avatar_url                TEXT DEFAULT '',
  allow_anonymous_questions BOOLEAN DEFAULT TRUE,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- QUESTIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_name  TEXT,
  content      TEXT NOT NULL CHECK (char_length(content) <= 500),
  is_answered  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS questions_recipient_idx ON questions(recipient_id);
CREATE INDEX IF NOT EXISTS questions_answered_idx  ON questions(recipient_id, is_answered);

-- ─────────────────────────────────────────────
-- ANSWERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS answers_author_idx ON answers(author_id);

-- ─────────────────────────────────────────────
-- LIKES (one per user per answer)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS likes (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer_id  UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, answer_id)
);

-- ─────────────────────────────────────────────
-- FOLLOWS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
