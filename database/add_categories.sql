-- Add categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add category_id to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

-- Insert default categories
INSERT INTO categories (name, slug, description, sort_order, is_published) VALUES
('All Courses', 'all', 'View all available courses', 0, true),
('Bundles', 'bundles', 'Course bundles and packages', 1, true),
('Networking', 'networking', 'Network infrastructure and security courses', 2, true),
('Cyber Security', 'cyber', 'Cybersecurity and ethical hacking courses', 3, true),
('Coding', 'coding', 'Programming and software development courses', 4, true),
('Management', 'management', 'IT management and leadership courses', 5, true)
ON CONFLICT (slug) DO NOTHING;

