const mongoose = require('mongoose');

const staffAdvanceSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'recovered'], default: 'pending' },
  recoveredAmount: { type: Number, default: 0 },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

staffAdvanceSchema.index({ schoolId: 1, staffId: 1 });
module.exports = mongoose.model('StaffAdvance', staffAdvanceSchema);
