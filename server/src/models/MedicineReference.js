// MedicineReference model – lookup table seeded from CSV
const mongoose = require('mongoose');

const medicineReferenceSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, lowercase: true, trim: true },
    composition: [{ type: String, lowercase: true, trim: true }],
    uses:        { type: String, trim: true },
  },
  { timestamps: false }
);

// Full-text search on name
medicineReferenceSchema.index({ name: 'text' });

module.exports = mongoose.model('MedicineReference', medicineReferenceSchema);
