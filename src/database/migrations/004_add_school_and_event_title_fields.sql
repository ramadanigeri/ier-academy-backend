-- Add school and event_title fields to event_registrations table
-- Migration 004: Add school and event_title fields

-- Add school column
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS school VARCHAR(255);

-- Add event_title column  
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS event_title VARCHAR(255);

-- Add index for event_title for better performance
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_title ON event_registrations(event_title);

-- Update existing records to have event_title from events table
UPDATE event_registrations 
SET event_title = e.title
FROM events e
WHERE event_registrations.event_id = e.id 
AND event_registrations.event_title IS NULL;

