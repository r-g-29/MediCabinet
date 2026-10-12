// Notification model – in-app alerts for expiry, low stock, missed doses
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:      { type: String, enum: ['expiry', 'lowstock', 'dose'], required: true },
    message:   { type: String, required: true },
    read:      { type: Boolean, default: false },
    dedupeKey: { type: String, required: true }, // prevents duplicate alerts per day
    medicineId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', default: null },
    // Email delivery tracking
    emailSent:      { type: Boolean, default: false },
    emailSentAt:    { type: Date, default: null },
    emailStatus:    { type: String, enum: ['none', 'pending', 'sent', 'failed', 'skipped'], default: 'none' },
    emailRecipient: { type: String, default: null },
    emailError:     { type: String, default: null },
  },
  { timestamps: true }
);

// One notification per dedupeKey per user
notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);
