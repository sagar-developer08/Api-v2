const mongoose = require('mongoose');

const attendanceNotificationSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  type: { type: String, enum: ['low_attendance', 'absent', 'bulk_reminder'], trim: true },
  recipientType: { type: String, enum: ['parent', 'student', 'guardian'], default: 'parent' },
  recipientIds: [{ type: mongoose.Schema.Types.ObjectId }],
  message: { type: String, trim: true },
  sentAt: { type: Date },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }
}, { timestamps: true });

attendanceNotificationSchema.index({ schoolId: 1 });
module.exports = mongoose.model('AttendanceNotification', attendanceNotificationSchema);
