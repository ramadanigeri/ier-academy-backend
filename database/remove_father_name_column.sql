-- Remove father_name column from enrollments table
-- This script removes the father_name field that is no longer needed

-- First, check if the column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'enrollments' 
        AND column_name = 'father_name'
        AND table_schema = 'public'
    ) THEN
        -- Remove the father_name column
        ALTER TABLE enrollments DROP COLUMN father_name;
        RAISE NOTICE 'Successfully removed father_name column from enrollments table';
    ELSE
        RAISE NOTICE 'father_name column does not exist in enrollments table';
    END IF;
END $$;
