const mongoose = require('mongoose');

const staffExperienceSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  organisation: { type: String, required: true, trim: true },
  role: { type: String, trim: true },
  fromDate: { type: Date },
  toDate: { type: Date, default: null },
  description: { type: String, trim: true }
}, { timestamps: true });

staffExperienceSchema.index({ schoolId: 1, staffId: 1 });
module.exports = mongoose.model('StaffExperience', staffExperienceSchema);
