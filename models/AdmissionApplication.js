const mongoose = require('mongoose');

const timelineItemSchema = new mongoose.Schema({
  status: String,
  title: String,
  by: String,
  at: { type: Date, default: Date.now },
  note: String
}, { _id: false });

const admissionApplicationSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  enquiryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry' },
  studentName: { type: String, required: true, trim: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  classApplied: { type: String, trim: true },
  status: { type: String, enum: ['draft', 'pending', 'submitted', 'under_review', 'approved', 'rejected', 'enrolled'], default: 'draft' },
  source: { type: String, enum: ['Website', 'Referral', 'Walk-in', 'Campaign'], default: 'Website' },
  academicYear: { type: String, trim: true },
  remarks: { type: String, trim: true },
  submissionDate: { type: Date, default: null },
  student: { type: mongoose.Schema.Types.Mixed, default: {} },
  parent: { type: mongoose.Schema.Types.Mixed, default: {} },
  academic: { type: mongoose.Schema.Types.Mixed, default: {} },
  timeline: [timelineItemSchema],
  entranceTest: { scheduledDate: Date, result: String, score: Number, remarks: String, venue: String },
  interview: { scheduledDate: Date, scheduledTime: String, interviewerName: String, result: String, remarks: String },
  reviewNotes: { type: String, trim: true },
  academicHistory: [{ institution: String, year: String, grade: String, board: String }]
}, { timestamps: true });

admissionApplicationSchema.index({ schoolId: 1, status: 1 });
module.exports = mongoose.model('AdmissionApplication', admissionApplicationSchema);
