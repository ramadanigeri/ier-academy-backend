-- Add payment_confirmed status to enrollment_status enum
ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'payment_confirmed';

-- Update existing enrollments that might need the new status
-- (This is optional - existing data will remain as is)

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_enrollments_status_created 
ON enrollments(status, created_at DESC);
