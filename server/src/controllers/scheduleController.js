const Schedule = require('../models/Schedule');
const Medicine = require('../models/Medicine');
const Profile = require('../models/Profile');

// Verify medicine + profile both belong to user
const validateOwnership = async (userId, medicineId, profileId) => {
  const [medicine, profile] = await Promise.all([
    Medicine.findOne({ _id: medicineId, userId }),
    Profile.findOne({ _id: profileId, userId }),
  ]);
  return { medicine, profile };
};

// GET /api/schedules
const getSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.find({ userId: req.user._id })
      .populate('medicineId', 'name genericName quantity')
      .populate('profileId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: schedules });
  } catch (err) {
    next(err);
  }
};

// POST /api/schedules
const createSchedule = async (req, res, next) => {
  try {
    const { medicineId, profileId, times, startDate, endDate } = req.body;

    const { medicine, profile } = await validateOwnership(req.user._id, medicineId, profileId);
    if (!medicine) return res.status(403).json({ success: false, message: 'Medicine not found or does not belong to you' });
    if (!profile)  return res.status(403).json({ success: false, message: 'Profile not found or does not belong to you' });

    const schedule = await Schedule.create({
      userId: req.user._id,
      medicineId,
      profileId,
      times,
      startDate,
      endDate: endDate || null,
      active: true,
    });

    const populated = await Schedule.findById(schedule._id)
      .populate('medicineId', 'name genericName quantity')
      .populate('profileId', 'name')
      .lean();

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/schedules/:id  (also used for deactivate)
const updateSchedule = async (req, res, next) => {
  try {
    const { times, startDate, endDate, active } = req.body;

    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { times, startDate, endDate, active },
      { new: true, runValidators: true }
    )
      .populate('medicineId', 'name genericName quantity')
      .populate('profileId', 'name')
      .lean();

    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/schedules/:id
const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSchedules, createSchedule, updateSchedule, deleteSchedule };
