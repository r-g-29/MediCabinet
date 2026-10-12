const express = require('express');
const router = express.Router();
const { getSummary, getAdherence, getWaste } = require('../controllers/statsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getSummary);
router.get('/adherence', getAdherence);
router.get('/waste', getWaste);

module.exports = router;
