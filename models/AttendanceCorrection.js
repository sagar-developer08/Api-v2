const mongoose = require('mongoose');

const attendanceCorrectionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentAttendance', required: true },
  requestedStatus: { type: String, enum: ['present', 'absent', 'late', 'half_day'] },
  reason: { type: String, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  remarks: { type: String, trim: true }
}, { timestamps: true });

attendanceCorrectionSchema.index({ schoolId: 1, status: 1 });
module.exports = mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);
