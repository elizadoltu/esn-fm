-- Migration 010: Comment images
ALTER TABLE comments ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

-- Allow content to be empty when an image is provided
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_content_check;
ALTER TABLE comments ADD CONSTRAINT comments_content_check
  CHECK (char_length(content) <= 200);
