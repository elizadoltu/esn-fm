-- Migration 008: Comment likes
CREATE TABLE IF NOT EXISTS comment_likes (
  user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS comment_likes_comment_idx ON comment_likes(comment_id);
