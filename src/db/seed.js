const db = require('./index');

async function seed() {
  // Add SimplyKeeping as first listing
  await db.query(`
    INSERT INTO listings (name, slug, category_id, short_description, address, city, state, zip, phone, website, status)
    SELECT 'SimplyKeeping', 'simplykeeping',
      (SELECT id FROM categories WHERE slug = 'home-services'),
      'Professional home and commercial cleaning services for Bristol and surrounding areas.',
      'Bristol', 'Bristol', 'VT', '05443', '', 'simplykeeping.com', 'active'
    WHERE NOT EXISTS (SELECT 1 FROM listings WHERE slug = 'simplykeeping')
  `);
  console.log('Seed complete.');
}

module.exports = { seed };
