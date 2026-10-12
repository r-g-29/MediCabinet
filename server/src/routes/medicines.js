const express = require('express');
const { z } = require('zod');
const { getMedicines, createMedicine, updateMedicine, deleteMedicine, checkDuplicate, sendMedicineAlertManual } = require('../controllers/medicineController');
const { scanMedicine } = require('../controllers/scanController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});
const router = express.Router();

const medicineSchema = z.object({
  profileId: z.string().nullable().optional(),
  name: z.string().min(1, 'Name is required'),
  genericName: z.string().optional().nullable(),
  activeIngredients: z.array(z.string()).optional().default([]),
  uses: z.string().optional().nullable(),
  expiry: z.string().or(z.date()).refine(val => !isNaN(Date.parse(val)), 'Invalid date'),
  batchNo: z.string().optional().nullable(),
  quantity: z.number().min(0),
  threshold: z.number().min(0).optional().default(5),
  price: z.number().min(0).optional().nullable(),
});

router.use(protect);

router.route('/')
  .get(getMedicines)
  .post(validate(medicineSchema), createMedicine);

router.post('/scan', upload.array('images', 2), scanMedicine);

router.post('/check-duplicate', checkDuplicate);

router.post('/:id/send-alert', sendMedicineAlertManual);

router.route('/:id')
  .put(validate(medicineSchema), updateMedicine)
  .delete(deleteMedicine);

module.exports = router;
