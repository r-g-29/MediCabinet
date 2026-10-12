const express = require('express');
const router = express.Router();
const { getTodayDoses, logDose } = require('../controllers/doseController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/today', getTodayDoses);
router.post('/log', logDose);

module.exports = router;
