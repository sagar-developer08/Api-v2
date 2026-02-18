const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  date: { type: Date, required: true },
  duration: { type: Number },
  trainer: { type: String, trim: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
}, { timestamps: true });

trainingSessionSchema.index({ schoolId: 1 });
module.exports = mongoose.model('TrainingSession', trainingSessionSchema);
