const express = require('express');
const router = express.Router();
const db = require('../db/index');

router.get('/', async (req, res, next) => {
  try {
    const { q = '', category = '' } = req.query;
    const params = [];
    let where = "WHERE l.status = 'active'";

    if (q) { params.push(`%${q}%`); where += ` AND (l.name ILIKE $${params.length} OR l.short_description ILIKE $${params.length} OR l.description ILIKE $${params.length})`; }
    if (category) { params.push(category); where += ` AND c.slug = $${params.length}`; }

    const { rows: listings } = await db.query(`
      SELECT l.*, c.name AS category_name, c.slug AS category_slug FROM listings l
      LEFT JOIN categories c ON l.category_id = c.id
      ${where} ORDER BY l.is_featured DESC, l.is_paid DESC, l.name ASC
    `, params);

    const { rows: categories } = await db.query('SELECT * FROM categories ORDER BY sort_order');

    res.render('search', {
      title: q ? `"${q}" — Bristol Digital Direct` : 'Search — Bristol Digital Direct',
      listings, categories, q, category
    });
  } catch (err) { next(err); }
});

module.exports = router;
