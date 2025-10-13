DROP TABLE IF EXISTS event_blocks CASCADE;
DROP TABLE IF EXISTS event_sections CASCADE;

CREATE TABLE event_sections (
  id SERIAL PRIMARY KEY,
  event_id UUID NOT NULL,
  title VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_blocks (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL,
  block_type VARCHAR(50) NOT NULL,
  position VARCHAR(20) DEFAULT 'middle',
  content JSONB NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE event_sections ADD CONSTRAINT fk_event_sections_event 
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE event_blocks ADD CONSTRAINT fk_event_blocks_section 
  FOREIGN KEY (section_id) REFERENCES event_sections(id) ON DELETE CASCADE;

CREATE INDEX idx_event_sections_event_id ON event_sections(event_id);
CREATE INDEX idx_event_sections_sort_order ON event_sections(sort_order);
CREATE INDEX idx_event_blocks_section_id ON event_blocks(section_id);
CREATE INDEX idx_event_blocks_sort_order ON event_blocks(sort_order);
CREATE INDEX idx_event_blocks_type ON event_blocks(block_type);