const mongoose = require('mongoose');

const ACADEMIC_YEAR_STATUS = ['Active', 'Inactive'];

const academicYearSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  },
  startYear: { type: Number, required: true },
  endYear: { type: Number, required: true },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ACADEMIC_YEAR_STATUS,
    default: 'Active'
  },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

academicYearSchema.index({ schoolId: 1 });
academicYearSchema.index({ branchId: 1 });
academicYearSchema.index({ schoolId: 1, branchId: 1 });
academicYearSchema.index({ schoolId: 1, branchId: 1, status: 1 });

module.exports = mongoose.model('AcademicYear', academicYearSchema);
module.exports.ACADEMIC_YEAR_STATUS = ACADEMIC_YEAR_STATUS;
