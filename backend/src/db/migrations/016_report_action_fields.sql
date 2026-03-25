-- Migration 016: Add action tracking fields to reports
-- Records the type of admin action taken and an optional message sent to the reported user.
ALTER TABLE reports ADD COLUMN IF NOT EXISTS action_type VARCHAR(50);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS action_message TEXT CHECK (char_length(action_message) <= 1000);
