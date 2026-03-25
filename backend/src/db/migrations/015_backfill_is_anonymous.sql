-- Migration 015: Backfill is_anonymous for pre-existing questions
-- A question is treated as anonymous when the sender was logged in (sender_id set)
-- but chose not to attach their name (sender_name IS NULL), and it wasn't a self-question.
UPDATE questions
SET is_anonymous = TRUE
WHERE sender_id IS NOT NULL
  AND sender_name IS NULL
  AND sender_id != recipient_id
  AND is_anonymous = FALSE;
