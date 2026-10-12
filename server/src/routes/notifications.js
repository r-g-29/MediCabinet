const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead, sendTestEmail } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.post('/test-email', sendTestEmail);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
