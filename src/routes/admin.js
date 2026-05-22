const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db/index');
const { requireAdmin } = require('../middleware/adminAuth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Handle quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Login
router.get('/login', (req, res) => {
  res.render('admin/login', { title: 'Admin Login', layout: 'admin/layout', error: null });
});

router.post('/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.render('admin/login', { title: 'Admin Login', layout: 'admin/layout', error: 'Incorrect password.' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// Dashboard — listings list
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { rows: listings } = await db.query(`
      SELECT l.*, c.name AS category_name
      FROM listings l LEFT JOIN categories c ON l.category_id = c.id
      ORDER BY l.created_at DESC
    `);
    const { rows: categories } = await db.query('SELECT * FROM categories ORDER BY sort_order');
    res.render('admin/index', { title: 'Admin — Listings', layout: 'admin/layout', listings, categories, saved: req.query.saved === '1' });
  } catch (err) { next(err); }
});

// New listing form
router.get('/new', requireAdmin, async (req, res, next) => {
  try {
    const { rows: categories } = await db.query('SELECT * FROM categories ORDER BY sort_order');
    res.render('admin/form', { title: 'New Listing', layout: 'admin/layout', listing: null, categories, error: null });
  } catch (err) { next(err); }
});

router.post('/new', requireAdmin, async (req, res, next) => {
  try {
    const { name, category_id, short_description, description, address, city, state, zip, phone, email, website, facebook, instagram, is_paid, is_featured, is_verified, status } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const result = await db.query(`
      INSERT INTO listings (name, slug, category_id, short_description, description, address, city, state, zip, phone, email, website, facebook, instagram, is_paid, is_featured, is_verified, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id
    `, [name, slug, category_id || null, short_description, description, address, city || 'Bristol', state || 'VT', zip || '05443', phone, email, website, facebook, instagram,
        is_paid === 'on', is_featured === 'on', is_verified === 'on', status || 'active']);

    // Fire N8N outreach webhook if listing has an email
    if (email && process.env.N8N_LISTING_WEBHOOK_URL) {
      try {
        const https = require('https');
        const payload = JSON.stringify({ name, email, listing_id: result.rows[0].id });
        const url = new URL(process.env.N8N_LISTING_WEBHOOK_URL);
        const reqN = https.request({ hostname: url.hostname, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } });
        reqN.write(payload);
        reqN.end();
      } catch (_) {}
    }
    res.redirect('/admin?saved=1');
  } catch (err) { next(err); }
});

// Edit listing form
router.get('/edit/:id', requireAdmin, async (req, res, next) => {
  try {
    const { rows: [listing] } = await db.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
    if (!listing) return res.redirect('/admin');
    const { rows: categories } = await db.query('SELECT * FROM categories ORDER BY sort_order');
    res.render('admin/form', { title: 'Edit — ' + listing.name, layout: 'admin/layout', listing, categories, error: null });
  } catch (err) { next(err); }
});

router.post('/edit/:id', requireAdmin, async (req, res, next) => {
  try {
    const { name, category_id, short_description, description, address, city, state, zip, phone, email, website, facebook, instagram, is_paid, is_featured, is_verified, status } = req.body;
    await db.query(`
      UPDATE listings SET name=$1, category_id=$2, short_description=$3, description=$4,
      address=$5, city=$6, state=$7, zip=$8, phone=$9, email=$10, website=$11,
      facebook=$12, instagram=$13, is_paid=$14, is_featured=$15, is_verified=$16,
      status=$17, updated_at=NOW() WHERE id=$18
    `, [name, category_id || null, short_description, description, address, city, state, zip, phone, email, website, facebook, instagram,
        is_paid === 'on', is_featured === 'on', is_verified === 'on', status, req.params.id]);
    res.redirect('/admin?saved=1');
  } catch (err) { next(err); }
});

// Delete
router.post('/delete/:id', requireAdmin, async (req, res, next) => {
  try {
    await db.query('DELETE FROM listings WHERE id = $1', [req.params.id]);
    res.redirect('/admin');
  } catch (err) { next(err); }
});

// CSV Import — download template
router.get('/import/template', requireAdmin, (req, res) => {
  const csv = 'name,category,short_description,phone,email,website,address,city,state,zip\nSimplyKeeping,home-services,Professional cleaning services for homes and businesses.,802-555-0100,info@simplykeeping.com,simplykeeping.com,123 Main St,Bristol,VT,05443\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="listings-template.csv"');
  res.send(csv);
});

// CSV Import — upload form
router.get('/import', requireAdmin, async (req, res, next) => {
  try {
    const { rows: categories } = await db.query('SELECT * FROM categories ORDER BY sort_order');
    res.render('admin/import', { title: 'Import Listings', layout: 'admin/layout', categories, results: null, error: null });
  } catch (err) { next(err); }
});

// CSV Import — process
router.post('/import', requireAdmin, upload.single('csvfile'), async (req, res, next) => {
  try {
    if (!req.file) return res.render('admin/import', { title: 'Import Listings', layout: 'admin/layout', categories: [], results: null, error: 'Please select a CSV file.' });

    const { rows: categories } = await db.query('SELECT * FROM categories ORDER BY sort_order');
    const catMap = {};
    categories.forEach(c => { catMap[c.slug] = c.id; catMap[c.name.toLowerCase()] = c.id; });

    const text = req.file.buffer.toString('utf8');
    const rows = parseCSV(text);

    let imported = 0, skipped = 0, errors = [];

    for (const row of rows) {
      if (!row.name || !row.name.trim()) { skipped++; continue; }
      try {
        const slug = row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now() + '-' + Math.floor(Math.random()*1000);
        const catId = catMap[row.category?.toLowerCase()] || null;
        await db.query(`
          INSERT INTO listings (name, slug, category_id, short_description, phone, email, website, address, city, state, zip, status)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active')
          ON CONFLICT (slug) DO NOTHING
        `, [row.name.trim(), slug, catId, row.short_description || null, row.phone || null, row.email || null, row.website || null, row.address || null, row.city || 'Bristol', row.state || 'VT', row.zip || '05443']);
        imported++;
      } catch (e) { errors.push(`${row.name}: ${e.message}`); }
    }

    res.render('admin/import', { title: 'Import Listings', layout: 'admin/layout', categories, results: { imported, skipped, errors }, error: null });
  } catch (err) { next(err); }
});

// Quick toggle
router.post('/toggle/:id/:field', requireAdmin, async (req, res, next) => {
  try {
    const allowed = ['is_paid', 'is_featured', 'is_verified'];
    if (!allowed.includes(req.params.field)) return res.redirect('/admin');
    await db.query(`UPDATE listings SET ${req.params.field} = NOT ${req.params.field} WHERE id = $1`, [req.params.id]);
    res.redirect('/admin');
  } catch (err) { next(err); }
});

module.exports = router;
