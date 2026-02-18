const mongoose = require('mongoose');

const staffPayrollSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  basicSalary: { type: Number, default: 0 },
  allowances: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netSalary: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'processed', 'paid'], default: 'draft' }
}, { timestamps: true });

staffPayrollSchema.index({ schoolId: 1, staffId: 1, month: 1, year: 1 }, { unique: true });
module.exports = mongoose.model('StaffPayroll', staffPayrollSchema);
