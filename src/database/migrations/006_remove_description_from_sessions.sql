-- Migration 006: Remove description column from sessions table

-- Remove 'description' column from the 'sessions' table
ALTER TABLE sessions
DROP COLUMN IF EXISTS description;
