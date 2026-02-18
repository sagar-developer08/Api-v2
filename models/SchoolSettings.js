const mongoose = require('mongoose');

const schoolSettingsSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    unique: true
  },
  academic: {
    defaultAcademicYear: { type: String, default: '' },
    promotionCutoffPercentage: { type: Number, default: 33 },
    maxLeavesAllowed: { type: Number, default: 15 }
  },
  attendance: {
    markAbsentAfterMinutes: { type: Number, default: 30 },
    allowCorrections: { type: Boolean, default: true },
    lockAfterDays: { type: Number, default: 7 }
  },
  fees: {
    lateFeeEnabled: { type: Boolean, default: false },
    lateFeeAmount: { type: Number, default: 0 },
    reminderDaysBeforeDue: { type: [Number], default: [7, 3, 1] }
  },
  notifications: {
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('SchoolSettings', schoolSettingsSchema);
