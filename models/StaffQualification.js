const mongoose = require('mongoose');

const staffQualificationSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  degree: { type: String, required: true, trim: true },
  institution: { type: String, trim: true },
  boardOrUniversity: { type: String, trim: true, default: '' },
  year: { type: Number },
  percentageOrCgpa: { type: String, trim: true, default: '' },
  specialization: { type: String, trim: true }
}, { timestamps: true });

staffQualificationSchema.index({ schoolId: 1, staffId: 1 });
module.exports = mongoose.model('StaffQualification', staffQualificationSchema);
