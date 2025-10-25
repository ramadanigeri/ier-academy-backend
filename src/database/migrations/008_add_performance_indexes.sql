-- Migration 008: Add performance indexes for courses pagination and filtering
-- This migration adds indexes to optimize the courses listing query performance

-- Index for courses pagination and filtering
CREATE INDEX IF NOT EXISTS idx_courses_published_sort ON courses(is_published, sort_order, created_at DESC);

-- Index for category filtering (used frequently in frontend)
CREATE INDEX IF NOT EXISTS idx_courses_category_published ON courses(category_id, is_published) WHERE category_id IS NOT NULL;

-- Index for instructor filtering
CREATE INDEX IF NOT EXISTS idx_courses_instructor_published ON courses(instructor_id, is_published) WHERE instructor_id IS NOT NULL;

-- Index for featured courses
CREATE INDEX IF NOT EXISTS idx_courses_featured_published ON courses(is_featured, is_published) WHERE is_featured = true;

-- Index for text search on title (using trigram for better ILIKE performance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_courses_title_trgm ON courses USING gin(title gin_trgm_ops);

-- Index for sessions by course_id (for fetching sessions per course)
CREATE INDEX IF NOT EXISTS idx_sessions_course_published ON sessions(course_id, is_published, start_date);

-- Index for categories slug lookup (used in URL routing)
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug) WHERE is_published = true;

-- Index for sessions date filtering
CREATE INDEX IF NOT EXISTS idx_sessions_start_date ON sessions(start_date) WHERE is_published = true;

-- Composite index for enrollment counting in sessions
CREATE INDEX IF NOT EXISTS idx_enrollments_session_status ON enrollments(session_id, status) WHERE status IN ('registered', 'payment_confirmed');

-- Add comments for documentation
COMMENT ON INDEX idx_courses_published_sort IS 'Optimizes courses listing with pagination (ORDER BY sort_order, created_at)';
COMMENT ON INDEX idx_courses_category_published IS 'Optimizes category filtering on courses page';
COMMENT ON INDEX idx_courses_title_trgm IS 'Enables fast ILIKE search on course titles using trigram matching';
COMMENT ON INDEX idx_sessions_course_published IS 'Optimizes sessions fetching per course';

