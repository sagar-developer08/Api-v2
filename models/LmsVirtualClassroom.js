const mongoose = require('mongoose');

const lmsVirtualClassroomSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  title: { type: String, required: true, trim: true },
  meetingUrl: { type: String, trim: true },
  status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
  startedAt: { type: Date },
  endedAt: { type: Date },
  participants: [{ userId: { type: mongoose.Schema.Types.ObjectId }, joinedAt: { type: Date }, leftAt: { type: Date } }]
}, { timestamps: true });

lmsVirtualClassroomSchema.index({ schoolId: 1, courseId: 1 });
module.exports = mongoose.model('LmsVirtualClassroom', lmsVirtualClassroomSchema);
