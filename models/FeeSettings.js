const mongoose = require('mongoose');

const feeSettingsSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, unique: true },
  lateFeeEnabled: { type: Boolean, default: false },
  lateFeeAmount: { type: Number, default: 0 },
  lateFeeType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  autoReminder: { type: Boolean, default: true },
  reminderDays: { type: [Number], default: [7, 3, 1] }
}, { timestamps: true });

module.exports = mongoose.model('FeeSettings', feeSettingsSchema);
