const mongoose = require('mongoose');

const feeHeadSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  type: { type: String, enum: ['tuition', 'library', 'sports', 'transport', 'hostel', 'other'], default: 'other' },
  description: { type: String, trim: true },
  isOptional: { type: Boolean, default: false },
  isRecurring: { type: Boolean, default: true }
}, { timestamps: true });

feeHeadSchema.index({ schoolId: 1 });
module.exports = mongoose.model('FeeHead', feeHeadSchema);
