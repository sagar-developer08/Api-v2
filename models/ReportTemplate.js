const mongoose = require('mongoose');

const reportTemplateSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['attendance', 'fees', 'exam', 'student', 'teacher'], required: true },
  format: { type: String, enum: ['pdf', 'excel', 'csv'], default: 'pdf' },
  config: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

reportTemplateSchema.index({ schoolId: 1 });
module.exports = mongoose.model('ReportTemplate', reportTemplateSchema);
