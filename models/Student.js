const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  line1: { type: String, trim: true },
  line2: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  country: { type: String, trim: true }
}, { _id: false });

const studentSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  studentId: {
    type: String,
    trim: true,
    description: 'Auto-generated ID like STU-2024-001'
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  middleName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'male', 'female', 'other'],
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    default: ''
  },
  aadhaarNumber: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    trim: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  rollNumber: {
    type: String,
    trim: true
  },
  admissionNumber: {
    type: String,
    required: true,
    trim: true
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'transferred', 'suspended'],
    default: 'active'
  },
  isMonitor: {
    type: Boolean,
    default: false
  },
  address: addressSchema,
  communicationAddress: addressSchema,
  isCommunicationSameAsPermanent: {
    type: Boolean,
    default: true
  },
  parentName: { // Keeping for backward compatibility or quick access
    type: String,
    trim: true
  },
  parentPhone: { // Keeping for backward compatibility
    type: String,
    trim: true
  }
}, { timestamps: true });

studentSchema.index({ schoolId: 1 });
studentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });
studentSchema.index({ schoolId: 1, studentId: 1 }, { unique: true, sparse: true });
studentSchema.index({ firstName: 'text', lastName: 'text', email: 'text', enrollmentNumber: 'text' });

module.exports = mongoose.model('Student', studentSchema);
