const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  startYear: { type: Number, required: true },
  endYear: { type: Number, required: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

academicYearSchema.index({ schoolId: 1 });

module.exports = mongoose.model('AcademicYear', academicYearSchema);
