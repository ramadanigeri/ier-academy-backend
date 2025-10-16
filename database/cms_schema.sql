-- Complete CMS Database Schema for IER Academy
-- This replaces all Sanity content with database-driven content
-- Every page will have customizable sections

-- =============================================
-- CORE CONTENT TABLES
-- =============================================

-- Pages table for all website pages
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  meta_title VARCHAR(255),
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Page sections for flexible layouts (Hero, Why Choose Us, Testimonials, etc.)
CREATE TABLE IF NOT EXISTS page_sections (
  id SERIAL PRIMARY KEY,
  page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
  section_type VARCHAR(50) NOT NULL, -- hero, why_choose_us, testimonials, faq, etc.
  title VARCHAR(255),
  subtitle TEXT,
  content TEXT, -- Rich text content
  data JSONB, -- Flexible data storage for different section types
  background_color VARCHAR(7), -- Hex color
  text_color VARCHAR(7), -- Hex color
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- SUPPORTING TABLES (CREATE FIRST)
-- =============================================

-- Instructors
CREATE TABLE IF NOT EXISTS instructors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255), -- e.g., "Senior Instructor", "Expert"
  bio TEXT,
  photo_url VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url VARCHAR(500),
  twitter_url VARCHAR(500),
  specialties TEXT[], -- Array of specialties
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Staff members
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  bio TEXT,
  photo_url VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(50),
  department VARCHAR(100),
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Venues
CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  capacity INTEGER,
  facilities TEXT[], -- Array of facilities
  photos_urls TEXT[], -- Array of photo URLs
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- MAIN CONTENT TABLES
-- =============================================

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  duration VARCHAR(50), -- e.g., "12 weeks", "3 months"
  level VARCHAR(50), -- e.g., "Beginner", "Intermediate", "Advanced"
  instructor_id INTEGER REFERENCES instructors(id),
  thumbnail_url VARCHAR(500),
  gallery_urls TEXT[], -- Array of image URLs
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course modules
CREATE TABLE IF NOT EXISTS course_modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  objectives TEXT, -- Learning objectives for this module
  outline TEXT, -- Course outline/content for this module
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course sessions
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  mode VARCHAR(50), -- online, offline, hybrid
  venue_id INTEGER REFERENCES venues(id),
  capacity INTEGER DEFAULT 0,
  enrolled_count INTEGER DEFAULT 0,
  price DECIMAL(10,2), -- Override course price if different
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  event_date TIMESTAMP,
  event_end_date TIMESTAMP,
  location VARCHAR(255),
  venue_id INTEGER REFERENCES venues(id),
  capacity INTEGER DEFAULT 0,
  registered_count INTEGER DEFAULT 0,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  thumbnail_url VARCHAR(500),
  gallery_urls TEXT[],
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT, -- Rich text content
  author_id INTEGER REFERENCES staff(id),
  featured_image_url VARCHAR(500),
  tags TEXT[], -- Array of tags
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);


-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  company VARCHAR(255),
  content TEXT NOT NULL,
  photo_url VARCHAR(500),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- FAQ items
CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100), -- e.g., "general", "courses", "events"
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Partners/Trusted Partners
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(500),
  website_url VARCHAR(500),
  description TEXT,
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- WEBSITE SETTINGS
-- =============================================

-- Global website settings
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  type VARCHAR(50) DEFAULT 'text', -- text, number, boolean, json, image
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INSERT DEFAULT PAGES WITH SECTIONS
-- =============================================

-- Insert default pages
INSERT INTO pages (slug, title, meta_title, meta_description, is_published) VALUES
('home', 'Home', 'IER Academy - Professional Training & Certification', 'Leading provider of professional training and certification programs', true),
('courses', 'Courses', 'Courses - IER Academy', 'Browse our comprehensive range of professional courses', true),
('about', 'About Us', 'About - IER Academy', 'Learn about IER Academy and our mission', true),
('blog', 'Blog', 'Blog - IER Academy', 'Latest news and insights from IER Academy', true),
('venues', 'Venues', 'Venues - IER Academy', 'Our training venues and facilities', true),
('staff', 'Staff', 'Staff - IER Academy', 'Meet our expert instructors and staff', true),
('instructors', 'Instructors', 'Instructors - IER Academy', 'Meet our certified instructors', true),
('contact', 'Contact Us', 'Contact - IER Academy', 'Get in touch with IER Academy', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert default sections for HOME page
INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'hero', 'Welcome to IER Academy', 'Professional Training & Certification Programs', 
       'Transform your career with our expert-led training programs designed for industry professionals.', 1, true
FROM pages p WHERE p.slug = 'home'
ON CONFLICT DO NOTHING;

INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'why_choose_us', 'Why Choose IER Academy?', 'Excellence in Professional Training', 
       'We provide industry-leading training programs with certified instructors and practical hands-on experience.', 2, true
FROM pages p WHERE p.slug = 'home'
ON CONFLICT DO NOTHING;

INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'trusted_partners', 'Trusted Partners', 'Industry Leaders Trust Us', 
       'We work with leading organizations to deliver world-class training solutions.', 3, true
FROM pages p WHERE p.slug = 'home'
ON CONFLICT DO NOTHING;

INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'testimonials', 'What Our Students Say', 'Success Stories', 
       'Hear from our graduates who have transformed their careers with our training programs.', 4, true
FROM pages p WHERE p.slug = 'home'
ON CONFLICT DO NOTHING;

INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'faq', 'Frequently Asked Questions', 'Get Answers', 
       'Find answers to common questions about our courses, enrollment process, and more.', 5, true
FROM pages p WHERE p.slug = 'home'
ON CONFLICT DO NOTHING;

-- Insert default sections for COURSES page
INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'hero', 'Our Courses', 'Professional Training Programs', 
       'Discover our comprehensive range of courses designed to advance your career.', 1, true
FROM pages p WHERE p.slug = 'courses'
ON CONFLICT DO NOTHING;

INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'course_categories', 'Course Categories', 'Find Your Path', 
       'Browse courses by category and find the perfect program for your career goals.', 2, true
FROM pages p WHERE p.slug = 'courses'
ON CONFLICT DO NOTHING;

-- Insert default sections for ABOUT page
INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'hero', 'About IER Academy', 'Excellence in Education', 
       'Learn about our mission, values, and commitment to professional excellence.', 1, true
FROM pages p WHERE p.slug = 'about'
ON CONFLICT DO NOTHING;

INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'our_mission', 'Our Mission', 'Empowering Professionals', 
       'We are dedicated to providing world-class training that empowers professionals to excel in their careers.', 2, true
FROM pages p WHERE p.slug = 'about'
ON CONFLICT DO NOTHING;

INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'our_values', 'Our Values', 'What We Stand For', 
       'Integrity, excellence, and innovation guide everything we do at IER Academy.', 3, true
FROM pages p WHERE p.slug = 'about'
ON CONFLICT DO NOTHING;

INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'our_team', 'Our Team', 'Meet the Experts', 
       'Our experienced instructors and staff are committed to your success.', 4, true
FROM pages p WHERE p.slug = 'about'
ON CONFLICT DO NOTHING;

-- Insert default sections for CONTACT page
INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'hero', 'Contact Us', 'Get in Touch', 
       'We are here to help you succeed. Reach out to us for any questions or support.', 1, true
FROM pages p WHERE p.slug = 'contact'
ON CONFLICT DO NOTHING;

INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'contact_info', 'Contact Information', 'How to Reach Us', 
       'Find our contact details and office locations.', 2, true
FROM pages p WHERE p.slug = 'contact'
ON CONFLICT DO NOTHING;

INSERT INTO page_sections (page_id, section_type, title, subtitle, content, sort_order, is_published) 
SELECT p.id, 'contact_form', 'Send Us a Message', 'We Will Get Back to You', 
       'Fill out the form below and we will respond to your inquiry promptly.', 3, true
FROM pages p WHERE p.slug = 'contact'
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, type, description) VALUES
('site_name', 'IER Academy', 'text', 'Website name'),
('site_description', 'Professional Training & Certification', 'text', 'Website description'),
('contact_email', 'info@ieracademy.com', 'text', 'Main contact email'),
('contact_phone', '+383 44 123 456', 'text', 'Main contact phone'),
('address', 'Pristina, Kosovo', 'text', 'Main address'),
('social_facebook', '', 'text', 'Facebook URL'),
('social_linkedin', '', 'text', 'LinkedIn URL'),
('social_twitter', '', 'text', 'Twitter URL'),
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_published ON pages(is_published);
CREATE INDEX IF NOT EXISTS idx_page_sections_page_id ON page_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_page_sections_type ON page_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_page_sections_sort_order ON page_sections(sort_order);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_published ON events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_sessions_course_id ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(is_published);
CREATE INDEX IF NOT EXISTS idx_faqs_published ON faqs(is_published);
CREATE INDEX IF NOT EXISTS idx_partners_published ON partners(is_published);
