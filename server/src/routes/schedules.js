const express = require('express');
const { z } = require('zod');
const router = express.Router();
const { getSchedules, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const scheduleSchema = z.object({
  medicineId: z.string().min(1, 'medicineId is required'),
  profileId:  z.string().min(1, 'profileId is required'),
  times:      z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Times must be HH:mm')).min(1, 'At least one time is required'),
  startDate:  z.string().refine(v => !isNaN(Date.parse(v)), 'Invalid startDate'),
  endDate:    z.string().refine(v => !isNaN(Date.parse(v)), 'Invalid endDate').optional().nullable(),
  active:     z.boolean().optional(),
});

router.use(protect);

router.route('/')
  .get(getSchedules)
  .post(validate(scheduleSchema), createSchedule);

router.route('/:id')
  .put(updateSchedule)
  .delete(deleteSchedule);

module.exports = router;
