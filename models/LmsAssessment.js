const mongoose = require('mongoose');

const lmsAssessmentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  maxScore: { type: Number, default: 100 },
  dueDate: { type: Date },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' }
}, { timestamps: true });

lmsAssessmentSchema.index({ schoolId: 1, courseId: 1 });
module.exports = mongoose.model('LmsAssessment', lmsAssessmentSchema);
