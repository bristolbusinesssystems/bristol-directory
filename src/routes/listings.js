const express = require('express');
const router = express.Router();
const db = require('../db/index');
const { isOpenNow, todayName } = require('../utils/hours');

router.get('/:slug', async (req, res, next) => {
  try {
    const { rows: [listing] } = await db.query(`
      SELECT l.*, c.name AS category_name, c.slug AS category_slug
      FROM listings l LEFT JOIN categories c ON l.category_id = c.id
      WHERE l.slug = $1 AND l.status = 'active'
    `, [req.params.slug]);
    if (!listing) return res.status(404).render('error', { title: 'Not Found', message: 'Listing not found.' });
    listing.is_open_now = isOpenNow(listing.hours);
    res.render('listing', { title: listing.name + ' — Bristol Digital Direct', listing, today: todayName() });
  } catch (err) { next(err); }
});

module.exports = router;
