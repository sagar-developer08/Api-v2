const mongoose = require('mongoose');

const PERIOD_TYPES = ['lesson', 'break', 'lunch'];

const periodTemplateSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', default: null },
  name: { type: String, required: true, trim: true },
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  type: { type: String, enum: PERIOD_TYPES, default: 'lesson' }
}, { timestamps: true });

periodTemplateSchema.index({ schoolId: 1, academicYearId: 1 });

module.exports = mongoose.model('PeriodTemplate', periodTemplateSchema);
