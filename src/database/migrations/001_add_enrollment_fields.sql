-- Migration: Add new fields to enrollments table for bank transfer system
-- Date: 2024
-- Description: Adds ID card, address, and father's name fields; updates status enums

-- Step 1: Add new columns to enrollments table
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS id_card VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);

-- Step 2: Update enrollment_status enum (if needed)
-- Note: Postgres doesn't allow easy enum modification, so we create a new type
DO $$ 
BEGIN
    -- Check if the new enum values exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'registered' AND enumtypid = 'enrollment_status'::regtype) THEN
        -- Create a temporary type with new values
        CREATE TYPE enrollment_status_new AS ENUM ('pending', 'registered', 'cancelled');
        
        -- Update the column type
        ALTER TABLE enrollments ALTER COLUMN status TYPE enrollment_status_new USING status::text::enrollment_status_new;
        
        -- Drop old type and rename new one
        DROP TYPE enrollment_status;
        ALTER TYPE enrollment_status_new RENAME TO enrollment_status;
    END IF;
END $$;

-- Step 3: Update payments table structure
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 4: Remove old Stripe-specific columns if they exist
ALTER TABLE payments 
DROP COLUMN IF EXISTS provider,
DROP COLUMN IF EXISTS provider_payment_id,
DROP COLUMN IF EXISTS webhook_payload;

-- Step 5: Update payment_status enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'verified' AND enumtypid = 'payment_status'::regtype) THEN
        CREATE TYPE payment_status_new AS ENUM ('pending', 'verified', 'cancelled');
        ALTER TABLE payments ALTER COLUMN status TYPE payment_status_new USING status::text::payment_status_new;
        DROP TYPE payment_status;
        ALTER TYPE payment_status_new RENAME TO payment_status;
    END IF;
END $$;

-- Step 6: Update any existing 'paid' status to 'registered'
UPDATE enrollments SET status = 'registered' WHERE status::text = 'paid';

-- Add indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_enrollments_id_card ON enrollments(id_card);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

