const mongoose = require('mongoose');

const lmsSettingsSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  allowSelfEnrollment: { type: Boolean, default: false },
  defaultCompletionPercent: { type: Number, default: 100 }
}, { timestamps: true });

lmsSettingsSchema.index({ schoolId: 1 }, { unique: true });
module.exports = mongoose.model('LmsSettings', lmsSettingsSchema);
