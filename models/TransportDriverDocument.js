const mongoose = require('mongoose');

const transportDriverDocumentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportDriver', required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, trim: true, enum: ['license', 'id-proof', 'other'], default: 'other' },
  fileUrl: { type: String, required: true, trim: true },
  expiryDate: { type: Date }
}, { timestamps: true });

transportDriverDocumentSchema.index({ schoolId: 1, driverId: 1 });
module.exports = mongoose.model('TransportDriverDocument', transportDriverDocumentSchema);
