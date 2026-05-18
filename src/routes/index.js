const express = require('express');
const router = express.Router();
const db = require('../db/index');

router.get('/', async (req, res, next) => {
  try {
    const [categories, featured, recent] = await Promise.all([
      db.query('SELECT *, (SELECT COUNT(*) FROM listings WHERE category_id = categories.id AND status = $1) AS count FROM categories ORDER BY sort_order', ['active']),
      db.query('SELECT l.*, c.name AS category_name FROM listings l LEFT JOIN categories c ON l.category_id = c.id WHERE l.status = $1 AND l.is_featured = TRUE ORDER BY l.name LIMIT 6', ['active']),
      db.query('SELECT l.*, c.name AS category_name FROM listings l LEFT JOIN categories c ON l.category_id = c.id WHERE l.status = $1 ORDER BY l.created_at DESC LIMIT 8', ['active'])
    ]);
    res.render('index', {
      title: 'Bristol Digital Direct — Bristol Vermont Business Directory',
      categories: categories.rows,
      featured: featured.rows,
      recent: recent.rows
    });
  } catch (err) { next(err); }
});

module.exports = router;
