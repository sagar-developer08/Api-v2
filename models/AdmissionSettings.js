const mongoose = require('mongoose');

const admissionSettingsSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  academicYear: { type: String, trim: true },
  formPublished: { type: Boolean, default: false },
  formOpenDate: { type: Date },
  formCloseDate: { type: Date },
  config: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

admissionSettingsSchema.index({ schoolId: 1 }, { unique: true });
module.exports = mongoose.model('AdmissionSettings', admissionSettingsSchema);
