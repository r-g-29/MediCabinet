const express = require('express');
const router = express.Router();
const { runAlertsNow } = require('../jobs/alertJob');
const { protect } = require('../middleware/auth');

// Dev-only endpoints – not available in production
if (process.env.NODE_ENV !== 'production') {
  router.post('/run-alerts', protect, async (req, res, next) => {
    try {
      await runAlertsNow();
      res.json({ success: true, message: 'Alerts triggered successfully' });
    } catch (err) {
      next(err);
    }
  });
}

module.exports = router;
