-- Add sort_order column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;


