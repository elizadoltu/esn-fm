-- Performance indexes for feed aggregation queries
-- likes.answer_id is not individually indexed (PK is (user_id, answer_id))
-- causing full table scans on every LEFT JOIN in feed/profile queries
CREATE INDEX IF NOT EXISTS likes_answer_id_idx ON likes(answer_id);

-- comment_likes.comment_id for similar JOIN patterns
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON comment_likes(comment_id);
