const mongoose = require('mongoose');

const studentNoteSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  type: { type: String, enum: ['admin_remark', 'teacher_remark', 'behavior', 'incident', 'communication'], default: 'admin_remark' },
  title: { type: String, trim: true },
  content: { type: String, required: true, trim: true },
  isPrivate: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'createdByModel' },
  createdByModel: { type: String, enum: ['Admin', 'Teacher'], default: 'Admin' }
}, { timestamps: true });

studentNoteSchema.index({ schoolId: 1, studentId: 1 });
module.exports = mongoose.model('StudentNote', studentNoteSchema);
