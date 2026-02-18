const mongoose = require('mongoose');

const attendanceConfigSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  markingMethod: { type: String, enum: ['period-wise', 'daily'], default: 'daily' },
  periodsPerDay: { type: Number, default: 8 },
  minAttendancePercent: { type: Number, default: 75 },
  config: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

attendanceConfigSchema.index({ schoolId: 1, classId: 1, sectionId: 1 });
module.exports = mongoose.model('AttendanceConfig', attendanceConfigSchema);
