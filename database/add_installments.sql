-- Add installment payment option to courses table
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS is_eligible_for_installments BOOLEAN DEFAULT false;

COMMENT ON COLUMN courses.is_eligible_for_installments IS 'Whether this course allows payment in 3 installments';

