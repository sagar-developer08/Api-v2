const mongoose = require('mongoose');

const SCHOOL_STATUS = ['Pending Setup', 'Pending Admin Approval', 'Approved', 'Rejected'];

const schoolSchema = new mongoose.Schema({
  schoolName: {
    type: String,
    required: true,
    trim: true
  },
  schoolCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  status: {
    type: String,
    required: true,
    enum: SCHOOL_STATUS,
    default: 'Pending Setup'
  },
  setupWizardStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 4
  },
  setupLocked: {
    type: Boolean,
    default: false
  },
  isSetup: {
    type: Boolean,
    default: false
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

  // Step 1 – Basic Information
  schoolType: {
    type: String,
    enum: ['School', 'College', 'Institute', ''],
    default: ''
  },
  boardCurriculum: {
    type: String,
    trim: true,
    default: ''
  },
  country: { type: String, trim: true, default: 'India' },
  state: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  timezone: { type: String, trim: true, default: 'Asia/Kolkata' },
  academicYearStartMonth: {
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', ''],
    default: ''
  }
}, { timestamps: true });

schoolSchema.index({ status: 1 });
schoolSchema.index({ adminId: 1 });

module.exports = mongoose.model('School', schoolSchema);
module.exports.SCHOOL_STATUS = SCHOOL_STATUS;
