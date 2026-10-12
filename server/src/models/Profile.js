// Profile model – a family member belonging to a user
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 0, max: 150 },
    relation: { type: String, trim: true }, // e.g. "Self", "Mother", "Child"
    allergies: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
