-- Update sessions table to match requirements
-- Add status field if it doesn't exist
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'coming_soon';

-- Update existing mode values if needed
-- The mode field already exists and can handle 'onsite' and 'hybrid'

-- Update comments for clarity
COMMENT ON COLUMN sessions.status IS 'Session status: coming_soon, registration_open, fully_booked';
COMMENT ON COLUMN sessions.mode IS 'Session delivery mode: onsite, hybrid';
COMMENT ON COLUMN sessions.capacity IS 'Maximum number of participants';
COMMENT ON COLUMN sessions.enrolled_count IS 'Current number of enrolled participants';

