const mongoose = require('mongoose');

const lmsProgressSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsContent' },
  progressPercent: { type: Number, default: 0 },
  completedAt: { type: Date }
}, { timestamps: true });

lmsProgressSchema.index({ schoolId: 1, studentId: 1, courseId: 1 });
module.exports = mongoose.model('LmsProgress', lmsProgressSchema);
