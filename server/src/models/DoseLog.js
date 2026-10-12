// DoseLog model – records whether a scheduled dose was taken or missed
const mongoose = require('mongoose');

const doseLogSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scheduleId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
    scheduledFor: { type: Date, required: true },
    status:       { type: String, enum: ['taken', 'missed'], required: true },
    loggedAt:     { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('DoseLog', doseLogSchema);
