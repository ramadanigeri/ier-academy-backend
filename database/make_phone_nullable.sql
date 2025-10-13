-- Make phone column nullable in event_registrations table
ALTER TABLE event_registrations
ALTER COLUMN phone DROP NOT NULL;

