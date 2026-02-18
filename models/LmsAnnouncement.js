const mongoose = require('mongoose');

const lmsAnnouncementSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

lmsAnnouncementSchema.index({ courseId: 1 });
module.exports = mongoose.model('LmsAnnouncement', lmsAnnouncementSchema);
