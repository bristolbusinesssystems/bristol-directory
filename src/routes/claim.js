const express = require('express');
const router = express.Router();

const CRM_SIGNUP_URL = process.env.CRM_SIGNUP_URL || 'https://crm.bristolbusinesssystems.com/signup';

router.get('/', (req, res) => {
  res.render('claim', {
    title: 'Claim Your Business Listing — Bristol Digital Direct',
    crmSignupUrl: CRM_SIGNUP_URL
  });
});

module.exports = router;
