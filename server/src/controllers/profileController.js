// Profile controller - handles CRUD for family members
const Profile = require('../models/Profile');

// GET /api/profiles
const getProfiles = async (req, res, next) => {
  try {
    const profiles = await Profile.find({ userId: req.user._id }).sort({ createdAt: 1 });
    res.json({ success: true, data: profiles });
  } catch (err) {
    next(err);
  }
};

// POST /api/profiles
const createProfile = async (req, res, next) => {
  try {
    const { name, age, relation, allergies } = req.body;
    const profile = await Profile.create({
      userId: req.user._id,
      name,
      age,
      relation,
      allergies
    });
    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// PUT /api/profiles/:id
const updateProfile = async (req, res, next) => {
  try {
    const { name, age, relation, allergies } = req.body;
    
    const profile = await Profile.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, age, relation, allergies },
      { new: true, runValidators: true }
    );
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/profiles/:id
const deleteProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    // In later phases, we should probably clean up medicines/schedules linked to this profile
    res.json({ success: true, message: 'Profile deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfiles, createProfile, updateProfile, deleteProfile };
