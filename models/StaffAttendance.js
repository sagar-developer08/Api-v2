const mongoose = require('mongoose');

const staffAttendanceSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'half_day', 'early_exit'], default: 'present' },
  checkInTime: { type: String, trim: true },
  checkOutTime: { type: String, trim: true },
  shift: { type: String, trim: true }
}, { timestamps: true });

staffAttendanceSchema.index({ schoolId: 1, staffId: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);
