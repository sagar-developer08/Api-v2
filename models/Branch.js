const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  isMain: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

branchSchema.index({ schoolId: 1 });

module.exports = mongoose.model('Branch', branchSchema);
