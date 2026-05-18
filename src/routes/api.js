const express = require('express');
const router = express.Router();
const db = require('../db/index');

// Called by CRM when a new org signs up via a directory listing claim
router.post('/claim', async (req, res) => {
  try {
    const { listing_id, org_id, secret } = req.body;
    if (!listing_id || !org_id) return res.status(400).json({ error: 'Missing fields' });
    if (process.env.DIRECTORY_API_SECRET && secret !== process.env.DIRECTORY_API_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await db.query(
      'UPDATE listings SET crm_org_id = $1, is_verified = TRUE WHERE id = $2',
      [org_id, listing_id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Claim API error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Called by CRM Stripe webhook when a subscription is activated
router.post('/subscription', async (req, res) => {
  try {
    const { org_id, plan, secret } = req.body;
    if (!org_id || !plan) return res.status(400).json({ error: 'Missing fields' });
    if (process.env.DIRECTORY_API_SECRET && secret !== process.env.DIRECTORY_API_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const isPaid = plan !== 'free';
    const isFeatured = plan === 'pro';
    await db.query(
      'UPDATE listings SET is_paid = $1, is_featured = $2, is_verified = TRUE WHERE crm_org_id = $3',
      [isPaid, isFeatured, org_id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Subscription API error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
