const mongoose = require('mongoose');

const reportJobSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  type: { type: String, enum: ['attendance', 'fees', 'exam', 'student', 'teacher'], required: true },
  format: { type: String, enum: ['pdf', 'excel', 'csv'], default: 'pdf' },
  filters: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  fileUrl: { type: String, trim: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, { timestamps: true });

reportJobSchema.index({ schoolId: 1, status: 1 });
module.exports = mongoose.model('ReportJob', reportJobSchema);
