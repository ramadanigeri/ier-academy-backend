-- Update enrollment statuses to match new workflow
-- enrolled -> paid -> registered -> cancelled

-- Add 'enrolled' and 'paid' statuses to enrollment_status enum
DO $$
BEGIN
    -- Add 'enrolled' status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'enrolled' AND enumtypid = 'enrollment_status'::regtype) THEN
        ALTER TYPE enrollment_status ADD VALUE 'enrolled';
    END IF;
    
    -- Add 'paid' status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paid' AND enumtypid = 'enrollment_status'::regtype) THEN
        ALTER TYPE enrollment_status ADD VALUE 'paid';
    END IF;
END $$;

-- Update existing 'pending' records to 'enrolled'
UPDATE enrollments SET status = 'enrolled' WHERE status = 'pending';

-- Update existing 'payment_confirmed' records to 'paid'
UPDATE enrollments SET status = 'paid' WHERE status = 'payment_confirmed';

-- Update default status for new enrollments
ALTER TABLE enrollments ALTER COLUMN status SET DEFAULT 'enrolled';
