-- Add 'new_answer' and 'new_dm' to the notifications type check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'new_question', 'new_like', 'new_comment', 'new_reply',
    'new_follower', 'new_answer', 'new_dm'
  ));
