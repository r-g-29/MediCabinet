const DoseLog = require('../models/DoseLog');
const Schedule = require('../models/Schedule');
const Medicine = require('../models/Medicine');

// GET /api/doses/today
// Generates today's dose slots from active schedules, merged with existing DoseLog entries
const getTodayDoses = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Build today's date range in local time (UTC boundaries)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Fetch all active schedules where today falls within start–end range
    const schedules = await Schedule.find({
      userId,
      active: true,
      startDate: { $lte: todayEnd },
      $or: [{ endDate: null }, { endDate: { $gte: todayStart } }],
    })
      .populate('medicineId', 'name genericName quantity threshold')
      .populate('profileId', 'name')
      .lean();

    if (!schedules.length) return res.json({ success: true, data: [] });

    // Fetch today's existing logs for these schedules
    const scheduleIds = schedules.map((s) => s._id);
    const logs = await DoseLog.find({
      userId,
      scheduleId: { $in: scheduleIds },
      scheduledFor: { $gte: todayStart, $lte: todayEnd },
    }).lean();

    // Build a map: "scheduleId|HH:mm" -> log
    const logMap = new Map();
    logs.forEach((log) => {
      const d = new Date(log.scheduledFor);
      const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      logMap.set(`${log.scheduleId}|${hhmm}`, log);
    });

    // Generate dose slots
    const doses = [];
    for (const schedule of schedules) {
      for (const time of schedule.times) {
        const [h, m] = time.split(':').map(Number);
        const scheduledFor = new Date(todayStart);
        scheduledFor.setHours(h, m, 0, 0);

        const key = `${schedule._id}|${time}`;
        const existingLog = logMap.get(key);

        let status = 'pending';
        if (existingLog) {
          status = existingLog.status;
        } else if (scheduledFor < now) {
          status = 'missed';
        }

        doses.push({
          scheduleId:   schedule._id,
          scheduledFor: scheduledFor.toISOString(),
          time,
          status,
          logId:        existingLog?._id || null,
          medicine: {
            _id:         schedule.medicineId?._id,
            name:        schedule.medicineId?.name,
            genericName: schedule.medicineId?.genericName,
            quantity:    schedule.medicineId?.quantity,
            threshold:   schedule.medicineId?.threshold,
          },
          profile: {
            _id:  schedule.profileId?._id,
            name: schedule.profileId?.name,
          },
        });
      }
    }

    // Sort by time
    doses.sort((a, b) => a.time.localeCompare(b.time));

    res.json({ success: true, data: doses });
  } catch (err) {
    next(err);
  }
};

// POST /api/doses/log
// Logs a dose; if taken, decrements medicine quantity (min 0). Prevents double-logging.
const logDose = async (req, res, next) => {
  try {
    const { scheduleId, scheduledFor, status } = req.body;
    const userId = req.user._id;

    if (!['taken', 'missed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status must be taken or missed' });
    }

    // Verify schedule belongs to user
    const schedule = await Schedule.findOne({ _id: scheduleId, userId });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

    const scheduledDate = new Date(scheduledFor);

    // Prevent double-logging: check if log already exists for this schedule+time slot
    const existing = await DoseLog.findOne({ userId, scheduleId, scheduledFor: scheduledDate });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This dose has already been logged',
        data: existing,
      });
    }

    // Create the log
    const log = await DoseLog.create({ userId, scheduleId, scheduledFor: scheduledDate, status });

    let updatedQuantity = null;

    // If taken, decrement medicine quantity (atomic, never below 0)
    if (status === 'taken') {
      const medicine = await Medicine.findOneAndUpdate(
        { _id: schedule.medicineId, userId, quantity: { $gt: 0 } },
        { $inc: { quantity: -1 } },
        { new: true }
      );
      updatedQuantity = medicine ? medicine.quantity : 0;
    }

    res.status(201).json({
      success: true,
      data: { log, updatedQuantity },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTodayDoses, logDose };
