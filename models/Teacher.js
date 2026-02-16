const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  employeeId: {
    type: String,
    trim: true
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
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    select: false
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  profilePhoto: {
    type: String
  },
  designation: {
    type: String,
    trim: true
  },
  departmentId: {
    type: String,
    trim: true
  },
  qualification: {
    type: String,
    trim: true
  },
  qualifications: [{
    type: {
      type: String,
      enum: ['degree', 'diploma', 'certificate', 'other']
    },
    name: String,
    institution: String,
    year: String,
    documentUrl: String
  }],
  documents: [{
    name: String,
    type: {
      type: String
    },
    fileUrl: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  topics: [{
    type: String
  }],
  address: {
    type: String
  },
  joiningDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated'],
    default: 'active'
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    preferences: {
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' }
    }
  },
  leaveBalance: {
    sick: { total: { type: Number, default: 12 }, used: { type: Number, default: 0 } },
    casual: { total: { type: Number, default: 10 }, used: { type: Number, default: 0 } },
    earned: { total: { type: Number, default: 15 }, used: { type: Number, default: 0 } }
  }
}, { timestamps: true });

// Hash password before saving
teacherSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
teacherSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

teacherSchema.index({ schoolId: 1 });
teacherSchema.index({ employeeId: 1, schoolId: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
