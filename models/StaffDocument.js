const mongoose = require('mongoose');

const staffDocumentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, trim: true, enum: ['id-proof', 'address-proof', 'qualification', 'experience', 'photograph', 'other'], default: 'other' },
  fileUrl: { type: String, required: true, trim: true },
  fileSize: { type: Number, default: 0 },
  mimeType: { type: String, trim: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

staffDocumentSchema.index({ schoolId: 1, staffId: 1 });
module.exports = mongoose.model('StaffDocument', staffDocumentSchema);
