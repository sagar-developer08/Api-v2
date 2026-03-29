const mongoose = require('mongoose');

const feeStructureRowSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  feeTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeHead', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR', trim: true },
  dueDate: { type: Date, required: true }
}, { timestamps: true });

feeStructureRowSchema.index(
  { schoolId: 1, academicYearId: 1, classId: 1, feeTypeId: 1 },
  { unique: true }
);

module.exports = mongoose.model('FeeStructureRow', feeStructureRowSchema);
