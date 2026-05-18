CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50) DEFAULT 'building',
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  short_description VARCHAR(255),
  description TEXT,
  address VARCHAR(255),
  city VARCHAR(100) DEFAULT 'Bristol',
  state VARCHAR(10) DEFAULT 'VT',
  zip VARCHAR(20) DEFAULT '05443',
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  facebook VARCHAR(255),
  instagram VARCHAR(255),
  hero_image VARCHAR(255),
  logo_image VARCHAR(255),
  hours JSONB DEFAULT '{}',
  is_paid BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  crm_org_id INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed categories
INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('Restaurants & Food',      'restaurants-food',      'cup-hot-fill',         1),
  ('Retail & Shopping',       'retail-shopping',       'bag-fill',             2),
  ('Health & Wellness',       'health-wellness',       'heart-pulse-fill',     3),
  ('Home Services',           'home-services',         'house-fill',           4),
  ('Professional Services',   'professional-services', 'briefcase-fill',       5),
  ('Arts & Entertainment',    'arts-entertainment',    'palette-fill',         6),
  ('Accommodation',           'accommodation',         'building-fill',        7),
  ('Outdoor & Recreation',    'outdoor-recreation',    'tree-fill',            8)
ON CONFLICT (slug) DO NOTHING;
