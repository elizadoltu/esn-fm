-- Migration 014: Optional reporter message on reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS message TEXT CHECK (char_length(message) <= 500);
