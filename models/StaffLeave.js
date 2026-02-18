const mongoose = require('mongoose');

const staffLeaveSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  leaveType: { type: String, enum: ['CL', 'SL', 'EL', 'ML', 'PL', 'other'], default: 'CL' },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  remarks: { type: String, trim: true }
}, { timestamps: true });

staffLeaveSchema.index({ schoolId: 1, staffId: 1 });
module.exports = mongoose.model('StaffLeave', staffLeaveSchema);
