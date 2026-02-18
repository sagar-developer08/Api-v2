const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
  childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  preferredDate: { type: Date },
  preferredTime: { type: String, trim: true },
  reason: { type: String, trim: true },
  status: { type: String, enum: ['requested', 'scheduled', 'completed', 'cancelled'], default: 'requested' },
  scheduledAt: { type: Date },
  notes: { type: String, trim: true }
}, { timestamps: true });

meetingSchema.index({ schoolId: 1, parentId: 1 });
module.exports = mongoose.model('ParentTeacherMeeting', meetingSchema);
