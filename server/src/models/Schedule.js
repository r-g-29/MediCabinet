// Schedule model – dosing schedule for a medicine
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
    medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    times:      [{ type: String, match: /^\d{2}:\d{2}$/ }], // HH:mm strings
    startDate:  { type: Date, required: true },
    endDate:    { type: Date, default: null },
    active:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Schedule', scheduleSchema);
