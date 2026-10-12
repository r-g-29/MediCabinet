const express = require('express');
const router = express.Router();
const { getEmergencyProfile } = require('../controllers/emergencyController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:profileId', getEmergencyProfile);

module.exports = router;
