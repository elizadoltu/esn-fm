-- Migration 004: Follow requests for private accounts

-- Add status to follows table
ALTER TABLE follows
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted'
    CHECK (status IN ('pending', 'accepted'));

-- Add follow_request to notifications type constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_question', 'new_like', 'new_comment', 'new_reply',
    'new_follower', 'new_answer', 'new_dm', 'follow_request'
  ));

-- Index for pending requests lookup
CREATE INDEX IF NOT EXISTS follows_pending_idx ON follows(following_id, status)
  WHERE status = 'pending';
