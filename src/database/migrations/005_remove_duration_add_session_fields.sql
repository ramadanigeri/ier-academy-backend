-- Migration: Remove duration from courses and add session enhancements
-- This migration removes the duration column from courses table and adds new fields to sessions table

-- Remove duration column from courses table
ALTER TABLE courses DROP COLUMN IF EXISTS duration;

-- Add new fields to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS start_time VARCHAR(5) DEFAULT '09:00';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS end_time VARCHAR(5) DEFAULT '17:00';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS weeks INTEGER DEFAULT 1;

-- Add constraints for time validation
ALTER TABLE sessions ADD CONSTRAINT check_start_time_format 
  CHECK (start_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE sessions ADD CONSTRAINT check_end_time_format 
  CHECK (end_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$');

ALTER TABLE sessions ADD CONSTRAINT check_weeks_positive 
  CHECK (weeks > 0);

-- Update existing sessions to have default values
UPDATE sessions 
SET start_time = '09:00', end_time = '17:00', weeks = 1 
WHERE start_time IS NULL OR end_time IS NULL OR weeks IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_end_time ON sessions(end_time);
CREATE INDEX IF NOT EXISTS idx_sessions_weeks ON sessions(weeks);

-- Success message
SELECT 'Migration completed: Duration removed from courses, session fields added' as message;
