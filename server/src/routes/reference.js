const express = require('express');
const router = express.Router();
const MedicineReference = require('../models/MedicineReference');
const { protect } = require('../middleware/auth');

router.get('/search', protect, async (req, res, next) => {
  try {
    const q = req.query.q ? req.query.q.trim().toLowerCase() : '';
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    // Escape special regex characters in user input
    const escaped = q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    // Case-insensitive prefix match on the (already lowercase) name field
    const prefixRegex = new RegExp('^' + escaped, 'i');
    // Also do a contains match as fallback
    const containsRegex = new RegExp(escaped, 'i');

    // First try prefix matches, then contains; merge & deduplicate by _id
    const [prefixResults, containsResults] = await Promise.all([
      MedicineReference.find({ name: prefixRegex }).limit(8).lean(),
      MedicineReference.find({ name: containsRegex }).limit(8).lean()
    ]);

    const seen = new Set();
    const merged = [];
    for (const doc of [...prefixResults, ...containsResults]) {
      const id = doc._id.toString();
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(doc);
      }
      if (merged.length >= 8) break;
    }

    res.json({ success: true, data: merged });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
