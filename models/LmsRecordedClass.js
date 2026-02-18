const mongoose = require('mongoose');

const lmsRecordedClassSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  title: { type: String, required: true, trim: true },
  videoUrl: { type: String, trim: true },
  duration: { type: Number },
  recordedAt: { type: Date },
  status: { type: String, enum: ['processing', 'ready', 'archived'], default: 'ready' }
}, { timestamps: true });

lmsRecordedClassSchema.index({ schoolId: 1, courseId: 1 });
module.exports = mongoose.model('LmsRecordedClass', lmsRecordedClassSchema);
