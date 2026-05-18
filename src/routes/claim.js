const express = require('express');
const router = express.Router();
const db = require('../db/index');

const CRM_SIGNUP_URL = process.env.CRM_SIGNUP_URL || 'https://crm.bristolbusinesssystems.com/signup';

router.get('/', async (req, res, next) => {
  try {
    const { listing_id } = req.query;
    let listing = null;
    if (listing_id) {
      const { rows } = await db.query('SELECT * FROM listings WHERE id = $1', [listing_id]);
      listing = rows[0] || null;
    }
    const signupUrl = listing
      ? `${CRM_SIGNUP_URL}?org_name=${encodeURIComponent(listing.name)}&listing_id=${listing.id}`
      : CRM_SIGNUP_URL;
    res.render('claim', {
      title: 'Claim Your Business Listing — Bristol Digital Direct',
      crmSignupUrl: signupUrl,
      listing
    });
  } catch (err) { next(err); }
});

module.exports = router;
