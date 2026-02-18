const mongoose = require('mongoose');

const teacherAttendanceSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'half_day', 'leave'], default: 'present' },
  checkInTime: { type: String, trim: true },
  checkOutTime: { type: String, trim: true },
  remarks: { type: String, trim: true }
}, { timestamps: true });

teacherAttendanceSchema.index({ schoolId: 1, teacherId: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('TeacherAttendance', teacherAttendanceSchema);
