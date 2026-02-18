const mongoose = require('mongoose');

const lmsAssessmentSubmissionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsAssessment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  score: { type: Number },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' }
}, { timestamps: true });

lmsAssessmentSubmissionSchema.index({ schoolId: 1, assessmentId: 1, studentId: 1 }, { unique: true });
module.exports = mongoose.model('LmsAssessmentSubmission', lmsAssessmentSubmissionSchema);
