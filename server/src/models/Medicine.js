// Medicine model – tracks a medicine belonging to a user and optional profile
const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    profileId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', default: null },
    name:             { type: String, required: true, trim: true },
    genericName:      { type: String, trim: true },
    activeIngredients:[{ type: String, trim: true, lowercase: true }],
    uses:             { type: String, trim: true },
    expiry:           { type: Date, required: true },
    batchNo:          { type: String, trim: true },
    quantity:         { type: Number, required: true, min: 0 },
    threshold:        { type: Number, default: 5, min: 0 }, // alert when qty <= threshold
    price:            { type: Number, min: 0, default: null },
    // Email tracking fields
    alertEmailSent:      { type: Boolean, default: false },
    alertEmailSentAt:    { type: Date, default: null },
    alertEmailStatus:    { type: String, enum: ['none', 'sent', 'failed'], default: 'none' },
    alertEmailRecipient: { type: String, default: null },
    alertEmailError:     { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);
