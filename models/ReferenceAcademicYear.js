const mongoose = require('mongoose');

const referenceAcademicYearSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number, required: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    region: { type: String, trim: true, default: null },
    country: { type: String, trim: true, default: null }
  },
  { timestamps: true }
);

referenceAcademicYearSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('ReferenceAcademicYear', referenceAcademicYearSchema);
