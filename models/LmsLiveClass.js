const mongoose = require('mongoose');

const lmsLiveClassSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  title: { type: String, required: true, trim: true },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number },
  meetingUrl: { type: String, trim: true },
  status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
  startedAt: { type: Date },
  endedAt: { type: Date }
}, { timestamps: true });

lmsLiveClassSchema.index({ schoolId: 1, courseId: 1 });
module.exports = mongoose.model('LmsLiveClass', lmsLiveClassSchema);
