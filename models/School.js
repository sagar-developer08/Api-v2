const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  // Step 1: School Details
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
  schoolType: {
    type: String,
    required: true,
    enum: ['Primary', 'Secondary', 'Higher Secondary', 'Composite']
  },
  boardAffiliation: {
    type: String,
    required: true,
    enum: ['CBSE', 'ICSE', 'State Board', 'IB', 'IGCSE', 'Other']
  },
  mediumOfInstruction: {
    type: String,
    required: true,
    enum: ['English', 'Hindi', 'Regional', 'Bilingual']
  },
  academicYearStartMonth: {
    type: String,
    required: true,
    enum: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  },
  establishmentYear: {
    type: Number,
    required: true,
    min: 1800,
    max: new Date().getFullYear()
  },

  // Step 2: Address & Contact
  addressLine1: {
    type: String,
    required: true,
    trim: true
  },
  addressLine2: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    required: true,
    trim: true,
    match: /^[0-9]{6}$/
  },
  country: {
    type: String,
    required: true,
    default: 'India'
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  officialEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  primaryPhoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  alternatePhoneNumber: {
    type: String,
    trim: true
  },
  websiteURL: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid URL']
  },

  // Step 3: Admin Account (reference to Admin model)
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

  // Step 4: Legal & Setup
  schoolRegistrationNumber: {
    type: String,
    trim: true
  },
  affiliationNumber: {
    type: String,
    trim: true
  },
  udiseCode: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  trustSocietyName: {
    type: String,
    trim: true
  },
  classesOffered: {
    type: String,
    trim: true
  },
  streams: {
    type: String,
    trim: true
  },
  sectionsPerClass: {
    type: String,
    trim: true
  },
  gradingSystem: {
    type: String,
    enum: ['Percentage', 'GPA', 'CGPA', 'Letter Grade', 'Other']
  },
  examPattern: {
    type: String,
    enum: ['Annual', 'Semester', 'Quarterly', 'Continuous', 'Other']
  },

  // Step 5: Modules & Plan (can be added later)
  modules: [{
    type: String
  }],
  plan: {
    type: String,
    enum: ['Basic', 'Standard', 'Premium', 'Enterprise']
  },

  // Registration Status
  registrationStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  isRegistrationComplete: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
schoolSchema.index({ schoolCode: 1 });
schoolSchema.index({ officialEmail: 1 });
schoolSchema.index({ adminId: 1 });

module.exports = mongoose.model('School', schoolSchema);

