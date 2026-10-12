// Profile routes - /api/profiles
const express = require('express');
const { z } = require('zod');
const { getProfiles, createProfile, updateProfile, deleteProfile } = require('../controllers/profileController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');

const router = express.Router();

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(0).max(150).optional().nullable(),
  relation: z.string().optional().nullable(),
  allergies: z.array(z.string()).optional().default([]),
});

// All profile routes require authentication
router.use(protect);

router.route('/')
  .get(getProfiles)
  .post(validate(profileSchema), createProfile);

router.route('/:id')
  .put(validate(profileSchema), updateProfile)
  .delete(deleteProfile);

module.exports = router;
