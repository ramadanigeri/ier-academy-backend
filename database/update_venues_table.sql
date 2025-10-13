-- Add missing columns to venues table if they don't exist
ALTER TABLE venues ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS amenities TEXT[];
ALTER TABLE venues ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE venues ADD COLUMN IF NOT EXISTS gallery_urls TEXT[];
ALTER TABLE venues ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add unique constraint on slug if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'venues_slug_key'
    ) THEN
        ALTER TABLE venues ADD CONSTRAINT venues_slug_key UNIQUE (slug);
    END IF;
END $$;

-- Update existing rows to have slugs if they don't
UPDATE venues 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

