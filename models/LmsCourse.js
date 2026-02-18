const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  academicYear: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' }
}, { timestamps: true });

courseSchema.index({ schoolId: 1 });
module.exports = mongoose.model('LmsCourse', courseSchema);
