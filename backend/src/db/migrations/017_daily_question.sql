-- Migration 017: Question of the Day
-- Adds: daily_questions, daily_question_answers, daily_question_answer_likes,
--        daily_question_answer_comments tables + question_of_day notification type

-- ── Daily questions (one active at a time) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content        TEXT NOT NULL CHECK (char_length(content) <= 300),
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_for  TIMESTAMPTZ DEFAULT NULL,
  published_at   TIMESTAMPTZ DEFAULT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS daily_questions_active_idx ON daily_questions(is_active);
CREATE INDEX IF NOT EXISTS daily_questions_published_idx ON daily_questions(published_at DESC);

-- ── User answers to the daily question ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_question_answers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_question_id UUID NOT NULL REFERENCES daily_questions(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content           TEXT NOT NULL CHECK (char_length(content) <= 1000),
  show_on_feed      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (daily_question_id, author_id)
);

CREATE INDEX IF NOT EXISTS dqa_question_idx ON daily_question_answers(daily_question_id);
CREATE INDEX IF NOT EXISTS dqa_author_idx   ON daily_question_answers(author_id);

-- ── Likes on daily question answers ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_question_answer_likes (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_answer_id UUID NOT NULL REFERENCES daily_question_answers(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, daily_answer_id)
);

-- ── Comments on daily question answers ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_question_answer_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_answer_id UUID NOT NULL REFERENCES daily_question_answers(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (char_length(content) <= 200),
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dqac_answer_idx ON daily_question_answer_comments(daily_answer_id);

-- ── Add question_of_day to notification type check ────────────────────────────
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_question', 'new_like', 'new_comment', 'new_reply',
    'new_follower', 'new_answer', 'new_dm', 'follow_request',
    'moderation_alert', 'question_of_day'
  ));
