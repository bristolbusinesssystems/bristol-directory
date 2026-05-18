const express = require('express');
const router = express.Router();
const db = require('../db/index');

router.get('/:slug', async (req, res, next) => {
  try {
    const { rows: [listing] } = await db.query(`
      SELECT l.*, c.name AS category_name, c.slug AS category_slug
      FROM listings l LEFT JOIN categories c ON l.category_id = c.id
      WHERE l.slug = $1 AND l.status = 'active'
    `, [req.params.slug]);
    if (!listing) return res.status(404).render('error', { title: 'Not Found', message: 'Listing not found.' });
    res.render('listing', { title: listing.name + ' — Bristol Digital Direct', listing });
  } catch (err) { next(err); }
});

module.exports = router;
