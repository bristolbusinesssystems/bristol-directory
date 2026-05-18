const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { requireAdmin } = require('../middleware/adminAuth');

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
    await db.query(`
      INSERT INTO listings (name, slug, category_id, short_description, description, address, city, state, zip, phone, email, website, facebook, instagram, is_paid, is_featured, is_verified, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    `, [name, slug, category_id || null, short_description, description, address, city || 'Bristol', state || 'VT', zip || '05443', phone, email, website, facebook, instagram,
        is_paid === 'on', is_featured === 'on', is_verified === 'on', status || 'active']);
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
