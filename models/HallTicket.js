const mongoose = require('mongoose');

const hallTicketSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  rollNumber: { type: String, trim: true },
  instructions: { type: String, trim: true }
}, { timestamps: true });

hallTicketSchema.index({ examId: 1, studentId: 1 }, { unique: true });
module.exports = mongoose.model('HallTicket', hallTicketSchema);
