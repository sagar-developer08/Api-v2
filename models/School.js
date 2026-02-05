const mongoose = require('mongoose');

const SCHOOL_STATUS = ['Pending Setup', 'Pending Admin Approval', 'Approved', 'Rejected'];

const SCHOOL_TYPE_OPTIONS = ['Private', 'Public', 'Government', 'International', 'School', 'College', 'Institute', ''];
const BOARD_AFFILIATION_OPTIONS = ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Cambridge', 'Other', ''];
const SCHOOL_CATEGORY_OPTIONS = ['Co-ed', 'Boys', 'Girls', ''];
const GRADING_SYSTEM_OPTIONS = ['Percentage', 'GPA', 'CGPA', 'Letter Grade', 'Other', ''];
const WORKING_DAYS_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Embedded schemas
const addressSchema = new mongoose.Schema({
  line1: { type: String, trim: true, default: '' },
  line2: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: 'India' },
  pinCode: { type: String, trim: true, default: '' }
}, { _id: false });

const principalSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, default: '' },
  contactNumber: { type: String, trim: true, default: '' }
}, { _id: false });

const adminOfficerSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: '' },
  contactNumber: { type: String, trim: true, default: '' }
}, { _id: false });

const policiesSchema = new mongoose.Schema({
  attendancePolicy: { type: String, trim: true, default: '' },
  promotionRules: { type: String, trim: true, default: '' },
  examGradingPolicy: { type: String, trim: true, default: '' },
  leavePolicy: { type: String, trim: true, default: '' },
  feePolicy: { type: String, trim: true, default: '' },
  disciplineCode: { type: String, trim: true, default: '' }
}, { _id: false });

const bankDetailsSchema = new mongoose.Schema({
  bankName: { type: String, trim: true, default: '' },
  accountNumber: { type: String, trim: true, default: '' },
  ifscCode: { type: String, trim: true, default: '' },
  branch: { type: String, trim: true, default: '' }
}, { _id: false });

const schoolSchema = new mongoose.Schema({
  // Core fields
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
    max: 7
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
  schoolLogo: { type: String, trim: true, default: '' },
  establishmentYear: { type: Date, default: null },
  schoolType: {
    type: String,
    enum: SCHOOL_TYPE_OPTIONS,
    default: ''
  },
  boardAffiliation: {
    type: String,
    enum: BOARD_AFFILIATION_OPTIONS,
    default: ''
  },
  boardCurriculum: {
    type: String,
    trim: true,
    default: ''
  },
  schoolCategory: {
    type: String,
    enum: SCHOOL_CATEGORY_OPTIONS,
    default: ''
  },
  recognitionNumber: { type: String, trim: true, default: '' },
  affiliationNumber: { type: String, trim: true, default: '' },

  // Step 2 – Contact Details
  primaryEmail: { type: String, trim: true, default: '' },
  secondaryEmail: { type: String, trim: true, default: '' },
  primaryPhone: { type: String, trim: true, default: '' },
  secondaryPhone: { type: String, trim: true, default: '' },
  website: { type: String, trim: true, default: '' },
  address: { type: addressSchema, default: () => ({}) },

  // Legacy location fields (kept for backward compatibility)
  country: { type: String, trim: true, default: 'India' },
  state: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  timezone: { type: String, trim: true, default: 'Asia/Kolkata' },

  // Step 3 – Administrative
  principal: { type: principalSchema, default: () => ({}) },
  adminOfficer: { type: adminOfficerSchema, default: () => ({}) },
  totalStudentCapacity: { type: Number, default: null },
  currentAcademicYear: { type: String, trim: true, default: '' },

  // Step 4 – Academic Structure
  classesOffered: [{ type: String, trim: true }],
  sectionsPerClass: [{ type: String, trim: true }],
  mediumOfInstruction: [{ type: String, trim: true }],
  workingDays: [{
    type: String,
    enum: WORKING_DAYS_OPTIONS
  }],
  defaultGradingSystem: {
    type: String,
    enum: GRADING_SYSTEM_OPTIONS,
    default: ''
  },
  academicYearStartMonth: {
    type: String,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', ''],
    default: ''
  },

  // Step 5 – Timings
  schoolStartTime: { type: String, trim: true, default: '' },
  schoolEndTime: { type: String, trim: true, default: '' },
  periodDuration: { type: Number, default: null },
  lunchStartTime: { type: String, trim: true, default: '' },
  lunchEndTime: { type: String, trim: true, default: '' },

  // Step 6 – Policies & Rules
  minAttendancePercentage: { type: Number, default: null },
  policies: { type: policiesSchema, default: () => ({}) },

  // Step 7 – Optional Details
  schoolMotto: { type: String, trim: true, default: '' },
  taxId: { type: String, trim: true, default: '' },
  gstNumber: { type: String, trim: true, default: '' },
  bankDetails: { type: bankDetailsSchema, default: () => ({}) }

}, { timestamps: true });

schoolSchema.index({ status: 1 });
schoolSchema.index({ adminId: 1 });

module.exports = mongoose.model('School', schoolSchema);
module.exports.SCHOOL_STATUS = SCHOOL_STATUS;
module.exports.SCHOOL_TYPE_OPTIONS = SCHOOL_TYPE_OPTIONS;
module.exports.BOARD_AFFILIATION_OPTIONS = BOARD_AFFILIATION_OPTIONS;
module.exports.SCHOOL_CATEGORY_OPTIONS = SCHOOL_CATEGORY_OPTIONS;
module.exports.GRADING_SYSTEM_OPTIONS = GRADING_SYSTEM_OPTIONS;
module.exports.WORKING_DAYS_OPTIONS = WORKING_DAYS_OPTIONS;
