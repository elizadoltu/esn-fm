-- Migration 009: Answer images
ALTER TABLE answers ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;
