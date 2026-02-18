const mongoose = require('mongoose');

const lmsCourseAttendanceSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, refPath: 'sessionModel' },
  sessionModel: { type: String, enum: ['LmsLiveClass', 'LmsVirtualClassroom'], default: 'LmsLiveClass' },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  duration: { type: Number }
}, { timestamps: true });

lmsCourseAttendanceSchema.index({ schoolId: 1, courseId: 1, studentId: 1, date: 1 });
module.exports = mongoose.model('LmsCourseAttendance', lmsCourseAttendanceSchema);
