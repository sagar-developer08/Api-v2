const mongoose = require('mongoose');

const staffReimbursementSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  amount: { type: Number, required: true },
  type: { type: String, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'paid'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

staffReimbursementSchema.index({ schoolId: 1, staffId: 1 });
module.exports = mongoose.model('StaffReimbursement', staffReimbursementSchema);
