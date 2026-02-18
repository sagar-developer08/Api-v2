const mongoose = require('mongoose');

const admissionDocumentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdmissionApplication', required: true },
  type: { type: String, trim: true },
  name: { type: String, trim: true },
  fileUrl: { type: String, required: true, trim: true },
  verified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  verifiedAt: { type: Date }
}, { timestamps: true });

admissionDocumentSchema.index({ schoolId: 1, applicationId: 1 });
module.exports = mongoose.model('AdmissionDocument', admissionDocumentSchema);
