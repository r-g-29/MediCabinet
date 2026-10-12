const Medicine = require('../models/Medicine');
const Profile = require('../models/Profile');
const { checkAndTriggerMedicineAlert } = require('../jobs/alertJob');

// Helper to compute medicine status
const computeStatus = (expiry) => {
  const now = new Date();
  const expiryDate = new Date(expiry);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (expiryDate < now) return 'expired';
  if (expiryDate <= thirtyDaysFromNow) return 'expiring';
  return 'ok';
};

// GET /api/medicines
const getMedicines = async (req, res, next) => {
  try {
    const { profileId, status, search } = req.query;
    
    // Base query scoped to user
    const query = { userId: req.user._id };

    // Filter by profileId
    if (profileId) {
      query.profileId = profileId;
    }

    // Search text (regex on name, genericName, uses)
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { genericName: regex },
        { uses: regex }
      ];
    }

    // Fetch all matching medicines from DB, then we filter by computed status if requested
    let medicines = await Medicine.find(query).populate('profileId', 'name').sort({ expiry: 1 }).lean();

    // Attach computed status
    medicines = medicines.map(med => ({
      ...med,
      status: computeStatus(med.expiry)
    }));

    // Filter by computed status
    if (status && status !== 'all') {
      if (status === 'lowstock') {
        medicines = medicines.filter(med => med.quantity <= med.threshold);
      } else {
        medicines = medicines.filter(med => med.status === status);
      }
    }

    res.json({ success: true, data: medicines });
  } catch (err) {
    next(err);
  }
};

// POST /api/medicines
const createMedicine = async (req, res, next) => {
  try {
    const data = req.body;
    
    // If a profileId is provided, verify it belongs to the user
    if (data.profileId) {
      const profile = await Profile.findOne({ _id: data.profileId, userId: req.user._id });
      if (!profile) {
        return res.status(403).json({ success: false, message: 'Invalid profile selected' });
      }
    }

    const medicine = await Medicine.create({
      ...data,
      userId: req.user._id
    });

    // Immediately evaluate alert conditions (expired, expiring soon, low stock) & trigger email
    await checkAndTriggerMedicineAlert(medicine, req.user._id);

    // Re-fetch with populated and updated email tracking fields
    const updated = await Medicine.findById(medicine._id).populate('profileId', 'name').lean();
    updated.status = computeStatus(updated.expiry);

    res.status(201).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/medicines/:id
const updateMedicine = async (req, res, next) => {
  try {
    const data = req.body;

    if (data.profileId) {
      const profile = await Profile.findOne({ _id: data.profileId, userId: req.user._id });
      if (!profile) {
        return res.status(403).json({ success: false, message: 'Invalid profile selected' });
      }
    }

    let medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      data,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Immediately re-evaluate alert conditions on update
    await checkAndTriggerMedicineAlert(medicine, req.user._id);

    const updated = await Medicine.findById(medicine._id).populate('profileId', 'name').lean();
    updated.status = computeStatus(updated.expiry);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/medicines/:id
const deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }
    res.json({ success: true, message: 'Medicine deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/medicines/:id/send-alert (Manual email alert trigger/resend)
const sendMedicineAlertManual = async (req, res, next) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, userId: req.user._id });
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const result = await checkAndTriggerMedicineAlert(medicine, req.user._id, { forceEmail: true });
    const updated = await Medicine.findById(medicine._id).populate('profileId', 'name').lean();
    updated.status = computeStatus(updated.expiry);

    res.json({
      success: true,
      message: result.emailSent 
        ? `Alert email sent successfully to ${result.recipient}` 
        : (result.message || 'Alert check completed'),
      data: updated,
      alertResult: result
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/medicines/check-duplicate
const checkDuplicate = async (req, res, next) => {
  try {
    const { profileId, activeIngredients } = req.body;
    
    if (!profileId || !activeIngredients || !activeIngredients.length) {
      return res.json({ success: true, data: [] });
    }

    const duplicates = await Medicine.find({
      userId: req.user._id,
      profileId: profileId,
      activeIngredients: { $in: activeIngredients }
    }).lean();

    res.json({ success: true, data: duplicates });
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  getMedicines, 
  createMedicine, 
  updateMedicine, 
  deleteMedicine, 
  sendMedicineAlertManual,
  checkDuplicate 
};
