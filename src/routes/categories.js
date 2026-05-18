const express = require('express');
const router = express.Router();
const db = require('../db/index');

router.get('/:slug', async (req, res, next) => {
  try {
    const { rows: [category] } = await db.query('SELECT * FROM categories WHERE slug = $1', [req.params.slug]);
    if (!category) return res.status(404).render('error', { title: 'Not Found', message: 'Category not found.' });
    const { rows: listings } = await db.query(`
      SELECT l.*, c.name AS category_name FROM listings l
      LEFT JOIN categories c ON l.category_id = c.id
      WHERE l.category_id = $1 AND l.status = 'active'
      ORDER BY l.is_featured DESC, l.is_paid DESC, l.name ASC
    `, [category.id]);
    res.render('category', { title: category.name + ' — Bristol Digital Direct', category, listings });
  } catch (err) { next(err); }
});

module.exports = router;
