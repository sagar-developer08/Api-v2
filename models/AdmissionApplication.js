const mongoose = require('mongoose');

const admissionApplicationSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry' },
  studentName: { type: String, required: true, trim: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  status: { type: String, enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'enrolled'], default: 'draft' },
  academicYear: { type: String, trim: true },
  entranceTest: { scheduledDate: Date, result: String, score: Number, remarks: String, venue: String },
  interview: { scheduledDate: Date, scheduledTime: String, interviewerName: String, result: String, remarks: String },
  reviewNotes: { type: String, trim: true },
  academicHistory: [{ institution: String, year: String, grade: String, board: String }]
}, { timestamps: true });

admissionApplicationSchema.index({ schoolId: 1, status: 1 });
module.exports = mongoose.model('AdmissionApplication', admissionApplicationSchema);
