-- Migration: Add new fields to enrollments table for bank transfer system
-- Date: 2024
-- Description: Adds ID card, address, and father's name fields; updates status enums

-- Step 1: Add new columns to enrollments table (if they don't exist)
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS id_card VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);

-- Step 2: Add new columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 3: Remove old Stripe-specific columns if they exist
ALTER TABLE payments 
DROP COLUMN IF EXISTS provider,
DROP COLUMN IF EXISTS provider_payment_id,
DROP COLUMN IF EXISTS webhook_payload;

-- Step 4: Add new enum values to existing enrollment_status type
-- This is safer than recreating the type
DO $$ 
BEGIN
    -- Add 'registered' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'registered' AND enumtypid = 'enrollment_status'::regtype) THEN
        ALTER TYPE enrollment_status ADD VALUE 'registered';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Step 5: Add new enum value to payment_status type
DO $$ 
BEGIN
    -- Add 'verified' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'verified' AND enumtypid = 'payment_status'::regtype) THEN
        ALTER TYPE payment_status ADD VALUE 'verified';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Step 6: Update any existing 'paid' status to 'registered' (only if 'paid' exists in enum)
DO $$ 
BEGIN
    -- Check if 'paid' value exists in the enum
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paid' AND enumtypid = 'enrollment_status'::regtype) THEN
        -- Update any records with 'paid' status
        UPDATE enrollments SET status = 'registered' WHERE status::text = 'paid';
    END IF;
END $$;

-- Step 7: Add indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_enrollments_id_card ON enrollments(id_card);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'New columns added: id_card, address, father_name';
    RAISE NOTICE 'Enum values added: registered, verified';
END $$;
