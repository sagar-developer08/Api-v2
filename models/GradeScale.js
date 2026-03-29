const mongoose = require('mongoose');

const bandSchema = new mongoose.Schema({
  label: { type: String, required: true },
  minPercent: { type: Number, required: true },
  maxPercent: { type: Number, required: true }
}, { _id: false });

const gradeScaleSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', default: null },
  bands: [bandSchema]
}, { timestamps: true });

gradeScaleSchema.index({ schoolId: 1 });

module.exports = mongoose.model('GradeScale', gradeScaleSchema);
