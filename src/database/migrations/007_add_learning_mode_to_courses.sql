-- Add learning_mode column to courses table
-- This migration adds a learning_mode field to track whether courses are self-paced, instructor-led, or none

ALTER TABLE courses 
ADD COLUMN learning_mode VARCHAR(20) DEFAULT 'none' CHECK (learning_mode IN ('none', 'self-paced', 'instructor-led'));

-- Add comment to explain the column
COMMENT ON COLUMN courses.learning_mode IS 'Learning mode: none (default), self-paced, or instructor-led';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_learning_mode ON courses(learning_mode);
