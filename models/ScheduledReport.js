const mongoose = require('mongoose');

const scheduledReportSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  type: { type: String, enum: ['attendance', 'fees', 'exam', 'student', 'teacher'], required: true },
  format: { type: String, enum: ['pdf', 'excel', 'csv'], default: 'pdf' },
  schedule: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  recipients: [{ type: String }],
  filters: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['active', 'paused', 'cancelled'], default: 'active' },
  lastRun: { type: Date },
  nextRun: { type: Date }
}, { timestamps: true });

scheduledReportSchema.index({ schoolId: 1 });
module.exports = mongoose.model('ScheduledReport', scheduledReportSchema);
