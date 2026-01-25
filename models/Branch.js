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
  city: { type: String, trim: true },
  isMain: { type: Boolean, default: false }
}, { timestamps: true });

branchSchema.index({ schoolId: 1 });

module.exports = mongoose.model('Branch', branchSchema);
