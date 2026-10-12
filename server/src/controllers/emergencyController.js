const mongoose = require('mongoose');
const Profile = require('../models/Profile');
const Medicine = require('../models/Medicine');
const Schedule = require('../models/Schedule');

const getEmergencyProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const profileId = req.params.profileId;

    const profile = await Profile.findOne({ _id: profileId, userId }).lean();
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Find all medicines that have an active schedule for this profile
    const activeSchedules = await Schedule.find({ profileId, userId, active: true }).lean();
    const scheduledMedicineIds = activeSchedules.map(s => s.medicineId.toString());

    // Also get all unexpired stock belonging to this profile directly
    const now = new Date();
    const medicines = await Medicine.find({
      userId,
      $or: [
        { _id: { $in: scheduledMedicineIds } },
        { profileId, expiry: { $gt: now }, quantity: { $gt: 0 } }
      ]
    }).lean();

    // Attach schedule times if available
    const medicinesWithSchedules = medicines.map(med => {
      const schedule = activeSchedules.find(s => s.medicineId.toString() === med._id.toString());
      return {
        ...med,
        scheduleTimes: schedule ? schedule.times : []
      };
    });

    const data = {
      profile,
      medicines: medicinesWithSchedules
    };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getEmergencyProfile };
