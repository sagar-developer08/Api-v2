const mongoose = require('mongoose');

const attendanceLockSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  date: { type: Date, required: true },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  unlockReason: { type: String, trim: true }
}, { timestamps: true });

attendanceLockSchema.index({ schoolId: 1, date: 1 });
module.exports = mongoose.model('AttendanceLock', attendanceLockSchema);
