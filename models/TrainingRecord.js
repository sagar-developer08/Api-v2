const mongoose = require('mongoose');

const trainingRecordSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingSession', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  attended: { type: Boolean, default: false },
  marks: { type: Number }
}, { timestamps: true });

trainingRecordSchema.index({ schoolId: 1, sessionId: 1 });
trainingRecordSchema.index({ schoolId: 1, staffId: 1 });
module.exports = mongoose.model('TrainingRecord', trainingRecordSchema);
