const mongoose = require('mongoose');

const staffLoanSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  amount: { type: Number, required: true },
  emiAmount: { type: Number },
  tenureMonths: { type: Number },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'active', 'closed'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

staffLoanSchema.index({ schoolId: 1, staffId: 1 });
module.exports = mongoose.model('StaffLoan', staffLoanSchema);
