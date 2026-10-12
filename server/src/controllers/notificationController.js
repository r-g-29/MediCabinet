const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/email');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: notifications });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

const sendTestEmail = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    const result = await sendEmail(
      userEmail,
      'MediCabinet: Test Email Alert',
      `Hello ${req.user.name || 'User'},\n\nThis is a verification email from your MediCabinet account. Your email alert tracking is configured and operating successfully.\n\nAll expiry and low-stock warnings will be dispatched to ${userEmail}.`,
      {
        type: 'Test Verification',
        medicineName: 'MediCabinet Alert Engine'
      }
    );

    if (result.success) {
      await Notification.create({
        userId: req.user._id,
        type: 'dose',
        message: `Test verification email delivered to ${userEmail}.`,
        dedupeKey: `test-email-${Date.now()}`,
        emailSent: true,
        emailSentAt: new Date(),
        emailStatus: 'sent',
        emailRecipient: userEmail
      });
      res.json({ success: true, message: `Test email sent to ${userEmail}`, result });
    } else {
      res.status(500).json({ success: false, message: `Failed to send email: ${result.error}`, result });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, sendTestEmail };

