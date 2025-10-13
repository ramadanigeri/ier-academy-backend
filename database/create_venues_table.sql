-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  capacity INTEGER,
  location VARCHAR(255),
  amenities TEXT[], -- Array of amenities
  image_url VARCHAR(500),
  gallery_urls TEXT[], -- Array of gallery image URLs
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE venues IS 'Training venues and facilities';
COMMENT ON COLUMN venues.amenities IS 'Array of venue amenities (e.g., WiFi, Projector, Whiteboard)';
COMMENT ON COLUMN venues.gallery_urls IS 'Array of additional gallery image URLs';

