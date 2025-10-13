-- Add multi-module flag to courses table
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS is_multi_module BOOLEAN DEFAULT true;

COMMENT ON COLUMN courses.is_multi_module IS 'Whether this course has multiple modules or single module with objectives/outline';

